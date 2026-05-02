import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
export type ReviewFormDocument = HydratedDocument<ReviewForm>;
@Schema({ timestamps: true })
export class ReviewForm {
  @Prop({ required: true }) title: string;
  @Prop({ required: true, unique: true, index: true }) code: string;
  @Prop({ required: true }) role: string;
  @Prop({ required: true, type: Object }) questions: any;
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' }) createdBy: Types.ObjectId;
  @Prop({ default: true }) isActive: boolean;
}
export const ReviewFormSchema = SchemaFactory.createForClass(ReviewForm);
