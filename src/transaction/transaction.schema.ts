import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {

  @Prop()
  wallet: string;

   @Prop()
  from: string;

  @Prop()
  txHash: string;

  @Prop()
  stageId: string;

  @Prop()
  amount: string;

  @Prop()
  tokens: string;

  @Prop({ default: true })
  verified: boolean;

  @Prop({ required: true })
  timestamp: Date;
}

export const TransactionSchema =
  SchemaFactory.createForClass(Transaction);
