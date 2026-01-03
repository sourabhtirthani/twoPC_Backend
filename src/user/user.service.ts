import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  async findByWallet(wallet: string) {
    return this.userModel.findOne({ wallet:wallet.toLowerCase() });
  }

  async register(wallet: string, name: string, referrer: string) {
    return this.userModel.create({
      wallet,
      name,
      referrer,
      role: 'USER'
    });
  }

  async fetchAll() {
    return await this.userModel.find().lean();
  }

  private async buildReferralTree(wallet: string): Promise<any> {
    const user = await this.userModel.findOne({ wallet }).lean();

    if (!user) return null;

    const referrals = await this.userModel
      .find({ referrer: wallet })
      .lean();

    const children = await Promise.all(
      referrals.map(ref => this.buildReferralTree(ref.wallet)),
    );

    return {
      name: user.name,
      children: children.filter(Boolean),
    };
  }

  async getReferralTree(wallet: string) {
    const tree = await this.buildReferralTree(wallet);

    if (!tree) {
      throw new NotFoundException('User not found');
    }

    return tree;
  }

}
