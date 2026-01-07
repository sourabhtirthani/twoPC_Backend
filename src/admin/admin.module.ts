import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

import { User, UserSchema } from '../user/user.schema';
import { IcoStage, IcoStageSchema } from '../ico/ico.schema';
import { StakingPlan, StakingPlanSchema } from '../staking/staking-plan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: IcoStage.name, schema: IcoStageSchema },
      { name: StakingPlan.name, schema: StakingPlanSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
