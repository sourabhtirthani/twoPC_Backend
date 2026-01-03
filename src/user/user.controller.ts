import { Controller, Post, Body,Get, Param, Query } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async fetchAll() {
    return await this.userService.fetchAll();
  }

  // 🔐 Wallet login check
  @Post('wallet-login')
  async walletLogin(@Body() body) {
    const user = await this.userService.findByWallet(body.wallet);
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
      body.wallet,
      body.name,
      body.referrer
    );
  }

  @Get('referral-tree')
  async getReferralTree(@Query('wallet') wallet: string) {
    return this.userService.getReferralTree(wallet.toLowerCase());
  }
}
