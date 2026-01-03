import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IcoStageDocument = IcoStage & Document;

@Schema({ timestamps: true })
export class IcoStage {
  @Prop()
  stageId: string;

  @Prop()
  title: string;

  @Prop()
  price: string;

  @Prop()
  start: number;

  @Prop()
  end: number;

  @Prop()
  minBuy: string;

  @Prop()
  maxBuy: string;

  @Prop()
  hardCap: string;

  @Prop({ default: 0 })
  sold: number;

  @Prop({ default: true })
  active: boolean;
}

export const IcoStageSchema = SchemaFactory.createForClass(IcoStage);
