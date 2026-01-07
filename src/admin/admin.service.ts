import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/user.schema';
import { IcoStage } from '../ico/ico.schema';
import { StakingPlan } from '../staking/staking-plan.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(IcoStage.name) private icoModel: Model<IcoStage>,
    @InjectModel(StakingPlan.name) private stakingPlanModel: Model<StakingPlan>,
  ) {}

  async getDashboardStats() {
    const [users, activeIcos, activeStakingPlans] = await Promise.all([
      this.userModel.countDocuments(),
      this.icoModel.countDocuments({ active: true }),
      this.stakingPlanModel.countDocuments({ active: true }),
    ]);

    return {
      users,
      activeIcos,
      activeStakingPlans,
    };
  }
}
