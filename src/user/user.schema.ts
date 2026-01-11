import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {

  @Prop({ required: true, unique: true })
  wallet: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: null })
  referrer: string;

  @Prop({ enum: ['USER', 'ADMIN'], default: 'USER' })
  role: 'USER' | 'ADMIN';

  @Prop({ default: 0 })
  balance: number; 

  @Prop({ default: 0 })
  referralIncome: number; 
}

export const UserSchema = SchemaFactory.createForClass(User);
