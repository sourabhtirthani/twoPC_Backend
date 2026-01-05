import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { StakingService } from "./staking.service";

@Controller('staking')
export class StakingController {

  constructor(private readonly staking: StakingService) {}

  /* ADMIN */
  @Post('plan/create')
  createPlan(@Body() body) {
    return this.staking.createPlan(body);
  }

  @Get('plans')
  getPlans() {
    return this.staking.getPlans();
  }
  @Get('rewards')
  getUserRewards(@Query('wallet') wallet: string) {
    return this.staking.getUserStakeAndRewards(wallet.toLowerCase());
  }

  /* USER */
  @Post('stake')
  stake(@Body() body) {
    return this.staking.stake(body);
  }

  @Post('user')
  getUser(@Body('wallet') wallet: string) {
    return this.staking.getUserStakes(wallet.toLowerCase());
  }

  @Get("user-stakes")
  async getUserStakes(@Query("wallet") wallet: string) {
    return this.staking.getUserStakes(wallet);
  }

  @Post("withdraw")
  withdraw(@Body() body: any) {
    const { wallet, stakeIndex, txHash } = body;
    return this.staking.withdraw(wallet, stakeIndex, txHash);
  }

  @Post("emergency-withdraw")
  emergencyWithdraw(@Body() body: any) {
    const { wallet, stakeIndex, txHash } = body;
    return this.staking.emergencyWithdraw(wallet, stakeIndex, txHash);
  }
}
