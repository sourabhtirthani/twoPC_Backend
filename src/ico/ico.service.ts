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
    const { buyer, phaseId, txHash, tokens, amount, rewards } = data;
    console.log('Completing purchase for', buyer, phaseId, txHash, tokens, amount, rewards);
    try { // 1️⃣ Prevent duplicate tx
      const exists = await this.transactionModel.findOne({ txHash });
      console.log('Existing transaction check:', exists);
      // if (exists) {
      //   return { success: false, message: 'Transaction already recorded' };
      // }

      const totalMlmWei = rewards.reduce(
        (sum, r) => Number(sum) + Number(r.amount),
        0n
      );
      const buyerNetWei = (tokens) - totalMlmWei;
      //2️⃣ Store BUY transaction
      await this.transactionModel.create({
        wallet: buyer.toLowerCase(),
        txHash,
        stageId: phaseId,
        amount: amount.toString(),
        tokens: buyerNetWei.toString(),
        verified: true,
      });

      //3️⃣ Update ICO sold
      await this.icoModel.findOneAndUpdate(
        { stageId: phaseId },
        { $inc: { sold: Number(tokens) } }
      );

      //4️⃣ Store MLM rewards
      for (const r of rewards) {
        await this.userModel.findOneAndUpdate(
          { wallet: r.wallet },
          { $inc: { balance: Number(tokens) } }
        );

        await this.transactionModel.create({
          wallet: r.wallet.toLowerCase(),
          txHash: `${txHash}`,
          stageId: phaseId,
          tokens: (r.amount).toString(),
          amount: '0',
          verified: true,
        });
      }

      return { success: true };
    }
    catch (error) {
      console.error('Error in completePurchase:', error);
      return { success: false, message: 'Internal server error' };
    }
  }
}