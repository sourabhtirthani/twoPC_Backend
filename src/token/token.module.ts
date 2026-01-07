import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TokenService } from "./token.service";
import { TokenController } from "./token.controller";
import {
  TokenTransaction,
  TokenTransactionSchema,
} from "./token-transaction.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TokenTransaction.name, schema: TokenTransactionSchema },
    ]),
  ],
  controllers: [TokenController],
  providers: [TokenService],
})
export class TokenModule {}
