import { Controller, Post, Body,Get, Param, Query } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async fetchAll() {
    return await this.userService.fetchAll();
  }

  @Get('referral-tree')
  async getReferralTree(@Query('wallet') wallet: string) {
    return this.userService.getReferralTree(wallet.toLowerCase());
  }

  @Get('stats')
  async getWalletStats(@Query('wallet') wallet: string) {
    console.log('Fetching dashboard stats for wallet:', wallet);
    return this.userService.getWalletDashboardStats(wallet);
  }

  @Get(':address')
  async fetchUser(@Param('address') address: string) {
    return await this.userService.fetchUser(address.toLowerCase());
  }

  @Get("referral-summary/:wallet")
  async referralSummary(@Param("wallet") wallet: string) {
    return this.userService.getReferralSummary(wallet);
  }
 
  
  // 🔐 Wallet login check
  @Post('wallet-login')
  async walletLogin(@Body() body) {
    const user = await this.userService.findByWallet((body.wallet).toLowerCase());
    console.log('wallet login check:', body.wallet, user);
    if (!user) {
      return { exists: false };
    }
    return { exists: true, role: user.role, user };
  }

  // 📝 Register after blockchain ref bind
  @Post('register')
  async register(@Body() body) {
    return this.userService.register(
      body.wallet.toLowerCase(),
      body.name,
      body.referrer
    );
  }

  
}
