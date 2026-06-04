import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AiEvaluationDocument = HydratedDocument<AiEvaluation>;

@Schema({ timestamps: true })
export class AiEvaluation {
  @Prop({ type: Types.ObjectId, ref: 'Employee' }) employeeId?: Types.ObjectId;
  @Prop({ required: true, index: true }) revieweeEmail: string;
  @Prop({ required: true }) revieweeName: string;
  @Prop({ type: Types.ObjectId, ref: 'ReviewCycle', index: true }) cycleId?: Types.ObjectId;
  @Prop({ type: [String], default: [] }) sourceFormCodes: string[];
  @Prop({ type: [Types.ObjectId], default: [] }) includedSubmissionIds: Types.ObjectId[];

  @Prop({ type: Object }) inputSnapshot?: Record<string, unknown>;

  @Prop() aiSummary?: string;
  @Prop() employeeFacingSummary?: string;
  @Prop() managerOnlySummary?: string;
  @Prop({ type: [Object], default: [] }) strengths: Record<string, unknown>[];
  @Prop({ type: [Object], default: [] }) improvementAreas: Record<string, unknown>[];
  @Prop({ type: [Object], default: [] }) aboveRoleSignals: Record<string, unknown>[];
  @Prop({ type: [Object], default: [] }) riskPatterns: Record<string, unknown>[];
  @Prop({ type: [Object], default: [] }) biasWarnings: Record<string, unknown>[];
  @Prop({ type: [String], default: [] }) missingEvidence: string[];
  @Prop({ type: [String], default: [] }) scoreInconsistencies: string[];
  @Prop({ type: Object }) developmentPlan?: Record<string, unknown>;
  @Prop({ type: [String], default: [] }) managerTalkingPoints: string[];
  @Prop({ type: Object }) finalDecisionRecommendation?: Record<string, unknown>;
  @Prop({ type: [String], default: [] }) safetyFlags: string[];
  @Prop({ type: Object }) performanceSection?: Record<string, unknown>;
  @Prop({ type: Object }) behavioralSection?: Record<string, unknown>;
  @Prop({ type: Object }) insightsSection?: Record<string, unknown>;

  @Prop({
    enum: ['exceptional', 'strong', 'good', 'needs_focus', 'at_risk', 'insufficient_data'],
  })
  recommendedBand?: string;
  @Prop() roleBasedScore?: number;
  @Prop() calibratedScore?: number;
  @Prop() confidenceScore?: number;
  @Prop({ enum: ['high', 'medium', 'low', 'insufficient'] }) evidenceStrength?: string;

  @Prop({ default: 'completed', enum: ['pending', 'processing', 'completed', 'failed'], index: true })
  status: string;
  @Prop() errorMessage?: string;
  @Prop({ default: false }) approvedByManager: boolean;
  @Prop() approvedAt?: Date;
  @Prop() managerEditedSummary?: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) approvedBy?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AiEvaluationSchema = SchemaFactory.createForClass(AiEvaluation);
AiEvaluationSchema.index({ revieweeEmail: 1, cycleId: 1, createdAt: -1 });
