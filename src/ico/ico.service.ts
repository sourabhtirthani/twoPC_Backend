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
) {}


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
  const { buyer, stageId, txHash, tokens, amount, rewards } = data;

  // 1️⃣ Prevent duplicate tx
const exists = await this.transactionModel.findOne({ txHash });
  if (exists) {
    return { success: false, message: 'Transaction already recorded' };
  }

  // 2️⃣ Store BUY transaction
  await this.transactionModel.create({
    wallet: buyer,
    txHash,
    stageId,
    amount: amount.toString(),
    tokens: tokens.toString(),
    verified: true,
  });

  // 3️⃣ Update ICO sold
  await this.icoModel.findOneAndUpdate(
    { _id: stageId },
    { $inc: { sold: tokens } }
  );

  // 4️⃣ Update MLM rewards (already calculated on frontend)
  for (const r of rewards) {
    await this.userModel.findOneAndUpdate(
      { wallet: r.wallet },
      { $inc: { balance: r.amount } }
    );

    await this.transactionModel.create({
      wallet: r.wallet,
      txHash: `${txHash}_${r.wallet}`,
      stageId,
      amount: r.amount.toString(),
      tokens: '0',
      verified: true,
    });
  }

  return { success: true };
}

}
