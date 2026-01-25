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
  console.log("Getting incoming summary for wallet:", wallet);
  const address = wallet.toLowerCase();
  console.log("Incoming summary for:", address);

  // 1️⃣ Fetch all incoming transactions
  const txs = await this.txModel
    .find({ wallet: address })
    .lean();

  console.log("TX COUNT:", txs.length);

  if (txs.length === 0) {
    return {
      wallet: address,
      totalReceived: "0",
      contributors: [],
    };
  }

  // 2️⃣ Group manually
  const map: Record<
    string,
    {
      fromWallet: string;
      totalAmount: number;
      txCount: number;
      lastTxAt: Date;
    }
  > = {};
    console.log("Processing transactions for grouping...", txs);
  for (const tx of txs) {
    const from = tx?.from.toLowerCase();
    const amount = Number(tx.tokens);

    if (!map[from]) {
      map[from] = {
        fromWallet: from,
        totalAmount: 0,
        txCount: 0,
        lastTxAt: tx.timestamp,
      };
    }

    map[from].totalAmount += isNaN(amount) ? 0 : amount;
    map[from].txCount += 1;

    if (tx.timestamp > map[from].lastTxAt) {
      map[from].lastTxAt = tx.timestamp;
    }
  }

  // 3️⃣ Fetch users for all senders
  const wallets = Object.keys(map);

  const users = await this.userModel
    .find({ wallet: { $in: wallets } })
    .select("wallet name")
    .lean();

  const userMap = new Map(
    users.map((u) => [u.wallet.toLowerCase(), u.name])
  );

  // 4️⃣ Build final response
  const contributors = Object.values(map).map((c) => ({
    fromWallet: c.fromWallet,
    fromName: userMap.get(c.fromWallet) || "Unknown User",
    totalAmount: Number(c.totalAmount.toFixed(6)),
    txCount: c.txCount,
    lastTxAt: c.lastTxAt,
  }));

  // 5️⃣ Sort by amount
  contributors.sort((a, b) => b.totalAmount - a.totalAmount);

  // 6️⃣ Grand total
  const grandTotal = contributors.reduce(
    (sum, c) => sum + c.totalAmount,
    0
  );

  return {
    wallet: address,
    totalReceived: grandTotal.toFixed(6),
    contributors,
  };
}
  

}
