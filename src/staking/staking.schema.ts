import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type StakingDocument = Staking & Document;

@Schema({ timestamps: true })
export class Staking {

  @Prop({ required: true, lowercase: true })
  wallet: string;

  // Smart contract plan index
  @Prop({ required: false })
  planIndex: number;

  @Prop({ required: true })
  amount: string; // stored as string for precision

  @Prop({ enum: ['ACTIVE', 'CLAIMED', 'EMERGENCY'], default: 'ACTIVE' })
  status: 'ACTIVE' | 'CLAIMED' | 'EMERGENCY';

  @Prop({ required: true, unique: true })
  txHash: string;

  @Prop({ default: null })
  withdrawTxHash?: string;
}

export const StakingSchema = SchemaFactory.createForClass(Staking);
