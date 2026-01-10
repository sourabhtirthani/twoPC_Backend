import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly txService: TransactionService) {}

  @Post('confirm')
  confirm(@Body() body) {
    return this.txService.store(body);
  }

   // ✅ NEW API
  @Get('by-wallet')
  getByWallet(@Query('wallet') wallet: string) {
    return this.txService.getByWallet(wallet);
  }

   @Get("transactions")
    getRefferalIncome(@Query("wallet") wallet: string) {
      console.log("Fetching incoming summary for wallet:", wallet);
      return this.txService.getIncomingSummary(wallet);
    }
}
