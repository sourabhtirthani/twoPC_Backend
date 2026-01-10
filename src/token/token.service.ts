import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import axios from "axios";
import { ethers } from "ethers";
import {
  TokenTransaction,
  TokenTransactionDocument,
} from "./token-transaction.schema";
import { UserSchema, UserDocument } from "src/user/user.schema";
import dotenv from "dotenv";
dotenv.config();
@Injectable()
export class TokenService {
  private readonly BSCSCAN_URL =
    "https://api-testnet.bscscan.com/api/v2";

  constructor(
    @InjectModel(TokenTransaction.name)
    private readonly txModel: Model<TokenTransactionDocument>,
    @InjectModel("User") private userModel: Model<UserDocument>,
  ) {}

  async syncTokenTransactions() {
   const { data } = await axios.get(
  "https://api.etherscan.io/v2/api",
  {
    params: {
      chainid: 97, // BSC Testnet
      module: "account",
      action: "tokentx",
      contractaddress: process.env.TOKEN_ADDRESS,
      page: 1,
      offset: 100,
      sort: "desc",
      apikey: process.env.BSCSCAN_API_KEY,
    },
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    },
  }
);
    console.log("BSCScan Response:", data);
    if (data.status !== "1") return [];

    for (const tx of data.result) {
      await this.txModel.updateOne(
        { txHash: tx.hash },
        {
          $setOnInsert: {
            txHash: tx.hash,
            from: tx.from.toLowerCase(),
            to: tx.to.toLowerCase(),
            amount: ethers.formatUnits(tx.value, tx.tokenDecimal),
            tokenSymbol: tx.tokenSymbol,
            timestamp: new Date(Number(tx.timeStamp) * 1000),
          },
        },
        { upsert: true },
      );
    }

    return { synced: data.result.length };
  }

  async getTransactions(limit = 50) {
    return this.txModel
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }
  
async getIncomingSummary(wallet: string) {
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

  for (const tx of txs) {
    const from = tx.from.toLowerCase();
    const amount = Number(tx.amount);

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

