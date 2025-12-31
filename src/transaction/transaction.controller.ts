import { Controller, Post, Body } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly txService: TransactionService) {}

  @Post('confirm')
  confirm(@Body() body) {
    return this.txService.store(body);
  }
}
