import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Staking, StakingDocument } from "./staking.schema";
import {TokenSendDocument, TokenSend } from "./tokenSend";
import { StakingPlan } from "./staking-plan.schema";
import { Transaction } from "src/transaction/transaction.schema";

@Injectable()
export class StakingService {
  constructor(
    @InjectModel(Staking.name)
    private readonly stakeModel: Model<StakingDocument>,

    @InjectModel(StakingPlan.name)
    private readonly planModel: Model<StakingPlan>,

    @InjectModel(Transaction.name)
    private readonly txModel: Model<Transaction>,

    @InjectModel(TokenSend.name)
    private readonly tokenSendModel: Model<TokenSendDocument>,
  ) {}

  /* ===================================================== */
  /* ================= ADMIN FUNCTIONS =================== */
  /* ===================================================== */

  async createPlan(data: {
    title: string;
    apr: number;
    lockDays: number;
    isFixed: boolean;
    minStake?: number;
    maxStake?: number; 
  }) {
    if (!data.title) {
      throw new BadRequestException("Plan title is required");
    }

    if (!data.apr || data.apr <= 0) {
      throw new BadRequestException("Invalid APR value");
    }

    if (data.isFixed && (!data.lockDays || data.lockDays <= 0)) {
      throw new BadRequestException("Lock days required for fixed plan");
    }
    const lastPlan = await this.planModel
    .findOne({})
    .sort({ planId: -1 })
    .select({ planId: 1 })
    .lean();

  // 2. Compute next planId
  const nextPlanId = lastPlan ? lastPlan.planId + 1 : 1;
    console.log('Creating plan with ID', nextPlanId);
    return this.planModel.create({
      title: data.title,
      apr: Number(data.apr),
      lockDays: Number(data.lockDays || 0),
      isFixed: Boolean(data.isFixed),
      active: true,
      minStake: Number(data.minStake || 0),
      maxStake: Number(data.maxStake || 0),
      planId: nextPlanId,
    });
  }

  async getPlans() {
    return this.planModel
      .find({ active: true })
      .sort({ createdAt: -1 })
      .lean();
  }

  /* ===================================================== */
  /* ================= USER STAKING ====================== */
  /* ===================================================== */

  async stake(data: {
    wallet: string;
    planId: string;       // Mongo _id
    planIndex: number;    // Contract plan index
    amount: string;
    txHash: string;
  }) {
    /* ================= VALIDATION ================= */

    if (!data.wallet) {
      throw new BadRequestException("Wallet address required");
    }
    console.log('Staking request from wallet', data.planId);
    // if (!data.planId || !Number(data.planId)) {
    //   throw new BadRequestException("Invalid planId");
    // }

    // if (data.planIndex === undefined || data.planIndex < 0) {
    //   throw new BadRequestException("Invalid plan index");
    // }

    if (!data.amount || Number(data.amount) <= 0) {
      throw new BadRequestException("Invalid staking amount");
    }

    if (!data.txHash) {
      throw new BadRequestException("Transaction hash required");
    }

    const wallet = data.wallet.toLowerCase();

    /* ============ DUPLICATE TX CHECK ============ */

    const existingTx = await this.txModel.findOne({
      txHash: data.txHash,
    });

    if (existingTx) {
      throw new BadRequestException("Transaction already recorded");
    }

    /* ============ PLAN VALIDATION ============ */

    const plan = await this.planModel.findOne({ planId: Number(data.planId) });

    if (!plan) {
      throw new NotFoundException("Staking plan not found");
    }

    if (!plan.active) {
      throw new BadRequestException("Staking plan is inactive");
    }

    /* ================= DB INSERT ================= */

    await this.stakeModel.create({
      wallet,
      planIndex: Number(data.planId),
      amount: data.amount,
      txHash: data.txHash,
      status: 'ACTIVE',
    });

    await this.txModel.create({
      wallet,
      txHash: data.txHash,
      amount: data.amount,
      tokens: data.amount,
      verified: true,
    });

    /* ================= RESPONSE ================= */

    return {
      success: true,
      message: "Stake recorded successfully",
    };
  }

  /* ===================================================== */
  /* ================= USER DATA ========================= */
  /* ===================================================== */


    async getUserStakeAndRewards(wallet: string) {
    const result = await this.stakeModel.aggregate([
      {
        $match: { wallet: wallet.toLowerCase(), status: 'ACTIVE' },
      },

      // Convert amount string → number
      {
        $addFields: {
          amountNumber: { $toDouble: '$amount' },
        },
      },

      // Group by plan
      {
        $group: {
          _id: '$planIndex',
          totalStakePerPlan: { $sum: '$amountNumber' },
        },
      },

      // Join staking plans
      {
        $lookup: {
          from: 'stakingplans',
          localField: '_id',
          foreignField: 'planId',
          as: 'plan',
        },
      },
      { $unwind: '$plan' },

      // Calculate reward per plan
      {
        $addFields: {
          rewardPerPlan: {
            $multiply: [
              '$totalStakePerPlan',
              { $divide: ['$plan.apr', 100] },
              { $divide: ['$plan.lockDays', 365] },
            ],
          },
        },
      },

      // Final aggregation
      {
        $group: {
          _id: null,
          totalStaked: { $sum: '$totalStakePerPlan' },
          totalRewards: { $sum: '$rewardPerPlan' },
        },
      },
    ]);

    return {
      wallet,
      totalStaked: result[0]?.totalStaked || 0,
      totalRewards: result[0]?.totalRewards || 0,
    };
  }

  async getUserStakes(wallet: string) {
    return this.stakeModel.aggregate([
      {
        $match: {
          wallet: wallet.toLowerCase(),
          status: "ACTIVE",
        },
      },

      // Join staking plans
      {
        $lookup: {
          from: "stakingplans",          // Mongo collection name
          localField: "planIndex",
          foreignField: "planId",
          as: "plan",
        },
      },

      { $unwind: "$plan" },

      // Compute unlock date
      {
        $addFields: {
          unlockAt: {
            $dateAdd: {
              startDate: "$createdAt",
              unit: "day",
              amount: "$plan.lockDays",
            },
          },
        },
      },

      // Shape response exactly for frontend
      {
        $project: {
          _id: 1,
          stakeIndex: "$planIndex",
          amount: 1,
          planTitle: "$plan.title",
          apr: "$plan.apr",
          unlockAt: 1,
          status: 1,
          txHash: 1,
          withdrawTxHash: 1,
          createdAt: 1,
        },
      },

      { $sort: { createdAt: -1 } },
    ]);
  }
    async withdraw(wallet: string, stakeIndex: number, txHash: string) {
    const stake = await this.stakeModel.findOne({
      wallet: wallet.toLowerCase(),
      planIndex: stakeIndex,
      status: 'ACTIVE',
    });

    if (!stake) {
      throw new BadRequestException("Stake not found or already withdrawn");
    }

    stake.status = 'CLAIMED';
    stake.withdrawTxHash = txHash;
    await stake.save();

    return { success: true };
  }

  async emergencyWithdraw(wallet: string, stakeIndex: number, txHash: string) {
    const stake = await this.stakeModel.findOne({
      wallet: wallet.toLowerCase(),
      planIndex: stakeIndex,
      status: 'ACTIVE',
    });

    if (!stake) {
      throw new BadRequestException("Stake not found or already withdrawn");
    }

    stake.status = 'EMERGENCY';
    stake.withdrawTxHash = txHash;
    await stake.save();

    return { success: true };
  }

  async tokenSend(data: {
    title: string;
    address: string;
    amount: number;
    txHash: string;
  }) {
    if (!data.title) {
      throw new BadRequestException("Plan title is required");
    }

    if (!data.address) {
      throw new BadRequestException("Address is required");
    }

    if (!data.amount || data.amount <= 0) {
      throw new BadRequestException("Invalid amount");
    }
    
   

  // 2. Compute next planId
 
    return this.tokenSendModel.create({
      title: data.title,
      address: data.address,
      amount: data.amount,
      txHash: data.txHash,
    });
  }

  async getUserList() {
    return this.tokenSendModel
      .find({})
      .sort({ createdAt: -1 })
      .lean();
  }
}
