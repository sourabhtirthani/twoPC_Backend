import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './transaction.schema';
import { User, UserDocument } from '../user/user.schema';
@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name)
    private txModel: Model<TransactionDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>, 
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
  
   
async getIncomingSummary(wallet: string) {
  const address = wallet.toLowerCase();
  console.log("Fetching incoming transactions for:", address);

  // 1️⃣ Fetch incoming transactions
  const txs = await this.txModel
    .find({
      wallet: address,
      from: { $exists: true, $ne: address }, // exclude self + invalid
    })
    .sort({ createdAt: -1 })
    .lean();

  if (!txs.length) {
    return {
      wallet: address,
      transactions: [],
    };
  }

  // 2️⃣ Collect unique sender wallets
  const senderWallets = Array.from(
    new Set(
      txs
        .map(tx => tx.from?.toLowerCase())
        .filter(Boolean)
    )
  );

  // 3️⃣ Fetch sender names
  const users = await this.userModel
    .find({ wallet: { $in: senderWallets } })
    .select("wallet name")
    .lean();

  const userMap = new Map(
    users.map(u => [u.wallet.toLowerCase(), u.name])
  );

  // 4️⃣ Build final transaction list
  const transactions = txs
    .filter(tx => tx.from) // final safety check
    .map(tx => ({
      _id: tx._id,
      txHash: tx.txHash,
      fromWallet: tx.from!.toLowerCase(),
      fromName: userMap.get(tx.from!.toLowerCase()) || "Unknown User",
      amount: Number(tx.tokens || tx.amount || 0),
      timestamp: tx.createdAt, // comes from timestamps:true
    }));

  return {
    wallet: address,
    transactions,
  };
}


  

}
