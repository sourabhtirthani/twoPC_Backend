import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TokenSendDocument = TokenSend & Document;

@Schema({ timestamps: true })
export class TokenSend {

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  amount: number;

   @Prop({ required: true })
  txHash: string;

}

/* ✅ THIS LINE WAS MISSING */
export const TokenSendSchema = SchemaFactory.createForClass(TokenSend);
