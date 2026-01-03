import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { UserModule } from './user/user.module';
import { IcoModule } from './ico/ico.module';
import { TransactionModule } from './transaction/transaction.module';
import { StakingModule } from './staking/staking.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot("mongodb+srv://sourabhtirthani:sourabhtirthani@cluster0.wpdlmbh.mongodb.net/two-pc-ico"),
    UserModule,
    IcoModule,
    TransactionModule,
    StakingModule,
  ],
})
export class AppModule {}
