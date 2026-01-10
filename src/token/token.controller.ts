import { Controller, Get, Query } from "@nestjs/common";
import { TokenService } from "./token.service";

@Controller("token")
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  // Manual sync (admin / cron)
  @Get("sync")
  sync() {
    return this.tokenService.syncTokenTransactions();
  }

  // Dashboard fetch
//   @Get("transactions")
//   getTransactions(@Query("limit") limit?: string) {
//     return this.tokenService.getTransactions(Number(limit) || 50);
//   }

   @Get("transactions")
  getRefferalIncome(@Query("wallet") wallet: string) {
    console.log("Fetching incoming summary for wallet:", wallet);
    return this.tokenService.getIncomingSummary(wallet);
  }
}
