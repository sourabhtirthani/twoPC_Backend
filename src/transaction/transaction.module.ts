import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './transaction.schema';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { User, UserSchema } from 'src/user/user.schema'; 
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema }
    ])
  ],
  providers: [TransactionService],
  controllers: [TransactionController]
})
export class TransactionModule {}
