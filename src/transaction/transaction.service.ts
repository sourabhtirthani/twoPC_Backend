import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './transaction.schema';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name)
    private txModel: Model<TransactionDocument>
  ) {}

  store(data) {
    return this.txModel.create(data);
  }

  async getByWallet(wallet: string) {
    const res= await this.txModel
      .find({ wallet: wallet })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
      console.log('Transactions for wallet', wallet, res);
    return res;
  }
}
