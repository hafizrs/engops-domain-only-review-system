import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
export type SubmissionDocument = HydratedDocument<Submission>;
@Schema({ timestamps: true })
export class Submission {
  @Prop({ required: true, type: Types.ObjectId, ref: 'ReviewForm', index: true }) formId: Types.ObjectId;
  @Prop({ required: true }) formCode: string;
  @Prop({ required: true }) reviewerName: string;
  @Prop({ required: true, lowercase: true }) reviewerEmail: string;
  @Prop({ required: true }) revieweeName: string;
  @Prop({ lowercase: true }) revieweeEmail?: string;
  @Prop({ required: true, type: Object }) answers: any;
  @Prop({ required: true }) totalScore: number;
  @Prop({ required: true }) submittedAt: Date;
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' }) submittedBy: Types.ObjectId;
}
export const SubmissionSchema = SchemaFactory.createForClass(Submission);
SubmissionSchema.index({ formId: 1, reviewerEmail: 1 }, { unique: true });
