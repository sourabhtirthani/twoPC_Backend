import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { UserModule } from './user/user.module';
import { IcoModule } from './ico/ico.module';
import { TransactionModule } from './transaction/transaction.module';
import { StakingModule } from './staking/staking.module';
import * as dotenv from 'dotenv';
import { TokenModule } from './token/token.module';
import { AdminModule } from './admin/admin.module';
dotenv.config();
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(`${process.env.MONGO_URI}`),
    UserModule,
    IcoModule,
    TransactionModule,
    StakingModule,
    TokenModule,
    AdminModule,
  ],
})
export class AppModule {}
