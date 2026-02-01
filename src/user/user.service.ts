import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { Staking, StakingDocument } from '../staking/staking.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Staking.name) private stakingModel: Model<StakingDocument>,
  ) {}

  async findByWallet(wallet: string) {
    return this.userModel.findOne({ wallet:wallet.toLowerCase() });
  }

  async register(wallet: string, name: string, referrer: string) {
    try{
      const existing = await this.userModel.findOne({ wallet: wallet.toLowerCase() });
      if (existing) {
        console.log('Registration failed: wallet already exists', wallet);
        throw new Error('Wallet already registered');
      }
      const existingReferrer = await this.userModel.findOne({ wallet: referrer.toLowerCase() });
      if (!existingReferrer) {
        throw new Error('Referrer wallet not found');
      }
      if (wallet.toLowerCase() === referrer.toLowerCase()) {
        throw new Error('Wallet cannot refer itself');
      }
      if (!name || name.trim() === '') {
        throw new Error('Name is required');
      }
      const newUser = await this.userModel.create({
        wallet: wallet.toLowerCase(),
        name,
        referrer  : referrer.toLowerCase(),
        role: 'USER'
    }); 
    console.log('User registered successfully:', newUser);
      return { success: true, user: newUser };
    } catch (err) {
      return { success: false, message: err.message };
    }
   
  }

  async fetchAll() {
  // 1️⃣ Fetch all users
  const users = await this.userModel.find().lean();

  // 2️⃣ Aggregate total stake per wallet (ACTIVE only)
  const stakes = await this.stakingModel.aggregate([
    {
      $match: {
        status: 'ACTIVE',
      },
    },
    {
      $group: {
        _id: '$wallet',
        totalStaked: {
          $sum: { $toDouble: '$amount' },
        },
      },
    },
  ]);

  // 3️⃣ Convert stake array → map for O(1) lookup
  const stakeMap = new Map<string, number>();
  for (const s of stakes) {
    stakeMap.set(s._id, s.totalStaked);
  }

  // 4️⃣ Merge stake info into users
  return users.map((user) => ({
    ...user,
    totalStaked: (stakeMap.get(user.wallet?.toLowerCase()) || 0).toFixed(6),
  }));
}


  async fetchUser(address: string) {
    const user = await this.userModel.findOne({ wallet: address }).lean();  
    if (!user) {
      throw new NotFoundException('User not found');
    }else {
      return user;
    }
  }

  private async buildReferralTree(wallet: string): Promise<any> {
    const user = await this.userModel.findOne({ wallet }).lean();

    if (!user) return null;

    const referrals = await this.userModel
      .find({ referrer: wallet })
      .lean();

    const children = await Promise.all(
      referrals.map(ref => this.buildReferralTree(ref.wallet)),
    );

    return {
      name: user.name,
      children: children.filter(Boolean),
    };
  }

  async getReferralTree(wallet: string) {
    const tree = await this.buildReferralTree(wallet);

    if (!tree) {
      throw new NotFoundException('User not found');
    }

    return tree;
  }

  async getWalletDashboardStats(wallet: string) {
    const address = wallet.toLowerCase();
    console.log("Getting dashboard stats for wallet:", address);
    // 1️⃣ Fetch staking records for wallet
    const stakings = await this.stakingModel
      .find({ wallet: address })
      .lean();

    let totalDeposit = 0;
    let totalActiveStake = 0;

    for (const stake of stakings) {
      const amount = Number(stake.amount);
      if (isNaN(amount)) continue;

      totalDeposit += amount;

      if (stake.status === 'ACTIVE') {
        totalActiveStake += amount;
      }
    }

    // 2️⃣ Fetch user commission
    const user = await this.userModel
      .findOne({ wallet: address.toLocaleLowerCase() })
      // .select('referralIncome')
      .lean();
    console.log("User for dashboard stats:", user);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      wallet: address,
      totalDeposit: user.balance.toFixed(4),
      totalActiveStake: totalActiveStake.toFixed(4),
      totalCommission: Number(user.referralIncome || 0).toFixed(4),
    };
  }

  async getReferralSummary(wallet: string) {
    const rootWallet = wallet.toLowerCase();
    console.log("Calculating referral summary for:", rootWallet);
    /** 1️⃣ Direct referrals */
    const directUsers = await this.userModel
      .find({ referrer: rootWallet })
      .select("wallet name referralIncome")
      .lean();

    const directReferrals = directUsers.length;

    /** 2️⃣ Network depth (BFS traversal) */
    let depth = 0;
    let currentLevel = directUsers.map(u => u.wallet);
    const visited = new Set<string>([rootWallet]);

    while (currentLevel.length > 0) {
      depth++;
      const nextLevelUsers = await this.userModel
        .find({ referrer: { $in: currentLevel } })
        .select("wallet")
        .lean();

      const nextLevel = nextLevelUsers
        .map(u => u.wallet)
        .filter(w => !visited.has(w));

      nextLevel.forEach(w => visited.add(w));
      currentLevel = nextLevel;
    }

    const networkDepth = depth === 0 ? 0 : depth;

    /** 3️⃣ Total referral income */
    const incomeAgg = await this.userModel.aggregate([
      {
        $match: {
          wallet: rootWallet,
        },
      },
      {
        $project: {
          referralIncome: 1,
        },
      },
    ]);

    const totalReferralIncome =
      incomeAgg.length > 0 ? incomeAgg[0].referralIncome : 0;

    return {
      wallet: rootWallet,
      directReferrals,
      networkDepth,
      totalReferralIncome,
      directUsers,
    };
  }
}
