import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type TokenTransactionDocument = TokenTransaction & Document;

@Schema({ timestamps: true })
export class TokenTransaction {

  @Prop({ required: true, unique: true })
  txHash: string;

  @Prop({ required: true, lowercase: true })
  from: string;

  @Prop({ required: true, lowercase: true })
  to: string;

  @Prop({ required: true })
  amount: string; // stored as string for precision

  @Prop({ required: true })
  tokenSymbol: string;

  @Prop({ required: true })
  timestamp: Date;
}

export const TokenTransactionSchema =
  SchemaFactory.createForClass(TokenTransaction);
