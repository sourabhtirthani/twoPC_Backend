import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import axios from "axios";
import { ethers } from "ethers";
import {
  TokenTransaction,
  TokenTransactionDocument,
} from "./token-transaction.schema";
import dotenv from "dotenv";
dotenv.config();
@Injectable()
export class TokenService {
  private readonly BSCSCAN_URL =
    "https://api-testnet.bscscan.com/api/v2";

  constructor(
    @InjectModel(TokenTransaction.name)
    private readonly txModel: Model<TokenTransactionDocument>,
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
}
