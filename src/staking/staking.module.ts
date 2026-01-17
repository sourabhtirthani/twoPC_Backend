import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { StakingController } from './staking.controller';
import { StakingService } from './staking.service';

import { Staking, StakingSchema } from './staking.schema';
import { StakingPlan, StakingPlanSchema } from './staking-plan.schema';
import { Transaction, TransactionSchema } from '../transaction/transaction.schema';
import { TokenSend, TokenSendSchema } from './tokenSend';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Staking.name, schema: StakingSchema },
      { name: StakingPlan.name, schema: StakingPlanSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: TokenSend.name, schema: TokenSendSchema },
    ]),
  ],
  controllers: [StakingController],
  providers: [StakingService],
  exports: [StakingService],
})
export class StakingModule {}
