import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IcoStage, IcoStageDocument } from './ico.schema';
import { Transaction, TransactionDocument } from '../transaction/transaction.schema';
import { User, UserDocument } from '../user/user.schema';

@Injectable()
export class IcoService {
  constructor(
    @InjectModel(IcoStage.name)
    private icoModel: Model<IcoStageDocument>,

    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }


  create(data) {
    return this.icoModel.create(data);
  }

  getActive() {
    return this.icoModel.find({ active: true });
  }

  getAll() {
    return this.icoModel.find();
  }
  async findAll() {
    return this.icoModel
      .find()
      .sort({ createdAt: -1 })
      .lean();
  }


  async completePurchase(data: any) {
    const MLM_PERCENTAGES = [
        4,  // Level 1
        1.5, // Level 2
        1,   // Level 3
        0.8, // Level 4
        0.7, // Level 5
        0.5, // Level 6
        0.4, // Level 7
        0.4, // Level 8
        0.4, // Level 9
        0.3, // Level 10
  ];

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const { buyer, phaseId, txHash, tokens, amount,currency } = data;

  const buyerWallet = buyer.toLowerCase();
  const totalTokens = Number(tokens);

  try {
    // 1️⃣ Prevent duplicate tx
    const exists = await this.transactionModel.findOne({ txHash });
    if (exists) {
      return { success: false, message: "Transaction already recorded" };
    }

    // 2️⃣ Fetch buyer
    let currentUser = await this.userModel.findOne({ wallet: buyerWallet });
    if (!currentUser) {
      throw new Error("Buyer not found");
    }

    let distributedTokens = 0;
    const rewards: {
      wallet: string;
      level: number;
      amount: number;
    }[] = [];

    // 3️⃣ Traverse upline (max 10 levels)
    for (let level = 0; level < 10; level++) {
      const referrerWallet = currentUser.referrer?.toLowerCase();
      console.log(`Level ${level + 1} referrer:`, referrerWallet);
      if (!referrerWallet || referrerWallet === ZERO_ADDRESS) {
        break;
      }

      const percentage = MLM_PERCENTAGES[level];
      const rewardAmount = (totalTokens * percentage)/100;

      if (rewardAmount > 0) {
        rewards.push({
          wallet: referrerWallet,
          level: level + 1,
          amount: rewardAmount,
        });

        distributedTokens += rewardAmount;
      }

      currentUser = await this.userModel.findOne({
        wallet: referrerWallet,
      });

      if (!currentUser) break;
    }

    // 4️⃣ Buyer net tokens
    const buyerNetTokens = totalTokens;

    // 5️⃣ Store BUY transaction (buyer)
    await this.transactionModel.create({
      wallet: buyerWallet,
      txHash,
      from: buyerWallet,
      stageId: phaseId,
      amount: amount.toString(),
      tokens: buyerNetTokens.toString(),
      verified: true,
      currency: currency || 'BNB',
    });

    // 6️⃣ Update buyer balance
    await this.userModel.findOneAndUpdate(
      { wallet: buyerWallet },
      { $inc: { balance: buyerNetTokens } }
    );

    // 7️⃣ Store MLM rewards
    for (const r of rewards) {
      await this.userModel.findOneAndUpdate(
        { wallet: r.wallet },
        {
          $inc: {
            balance: r.amount,
            referralIncome: Number(r.amount),
          },
        }
      );

      await this.transactionModel.create({
        wallet: r.wallet,
        txHash: `${txHash}`,
        from: buyerWallet,
        stageId: phaseId,
        tokens: r.amount.toString(),
        amount: "0",
        verified: true,
        currency: currency || 'BNB',
      });
    }

    // 8️⃣ Update ICO sold
    await this.icoModel.findOneAndUpdate(
      { stageId: phaseId },
      { $inc: { sold: totalTokens } }
    );

    return {
      success: true,
      buyerNetTokens,
      distributedTokens,
      rewards,
    };
  } catch (error) {
    console.error("Error in completePurchase:", error);
    return { success: false, message: "Internal server error" };
  }
}

}