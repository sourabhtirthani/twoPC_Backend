import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StakingPlanDocument = StakingPlan & Document;

@Schema({ timestamps: true })
export class StakingPlan {

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  apr: number;

  @Prop({ required: true })
  lockDays: number;

  @Prop({ required: true })
  planId: number;

   @Prop({ required: true })
  minStake: number;

  @Prop({ default: false })
  isFixed: boolean;

  @Prop({ default: true })
  active: boolean;
}

/* ✅ THIS LINE WAS MISSING */
export const StakingPlanSchema = SchemaFactory.createForClass(StakingPlan);
