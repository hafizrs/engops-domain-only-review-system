import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
export type UserDocument = HydratedDocument<User>;
export type UserRole = 'admin' | 'manager';
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true }) email: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true, enum: ['admin', 'manager'], default: 'manager' }) role: UserRole;
  @Prop() microsoftOid?: string;
  @Prop({ default: true }) isActive: boolean;
}
export const UserSchema = SchemaFactory.createForClass(User);
