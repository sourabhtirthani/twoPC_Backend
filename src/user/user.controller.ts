import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
}
