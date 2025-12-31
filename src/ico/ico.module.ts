import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IcoStage, IcoStageSchema } from './ico.schema';
import { IcoService } from './ico.service';
import { IcoController } from './ico.controller';
import { User, UserSchema } from 'src/user/user.schema';
import { Transaction,TransactionSchema } from 'src/transaction/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IcoStage.name, schema: IcoStageSchema },
       { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
    ])
  ],
  providers: [IcoService],
  controllers: [IcoController],
})
export class IcoModule {}
