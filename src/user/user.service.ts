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
    return this.userModel.create({
      wallet,
      name,
      referrer,
      role: 'USER'
    });
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
      totalDeposit: totalDeposit.toFixed(4),
      totalActiveStake: totalActiveStake.toFixed(4),
      totalCommission: Number(user.referralIncome || 0).toFixed(4),
    };
  }
}
