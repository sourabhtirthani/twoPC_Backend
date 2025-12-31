import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  async findByWallet(wallet: string) {
    return this.userModel.findOne({ wallet });
  }

  async register(wallet: string, name: string, referrer: string) {
    return this.userModel.create({
      wallet,
      name,
      referrer,
      role: 'USER'
    });
  }
}
