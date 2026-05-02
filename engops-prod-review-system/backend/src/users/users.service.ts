import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './user.schema';
@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private model: Model<UserDocument>) {}
  findByEmail(email: string) { return this.model.findOne({ email: email.toLowerCase() }); }
  async upsertFromEmail(email: string, name: string, role: UserRole = 'manager', microsoftOid?: string) {
    return this.model.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $setOnInsert: { email: email.toLowerCase() }, $set: { name, role, microsoftOid, isActive: true } },
      { upsert: true, new: true },
    );
  }
}
