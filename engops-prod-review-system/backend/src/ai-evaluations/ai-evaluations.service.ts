import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ReviewForm, ReviewFormDocument } from '../review-forms/review-form.schema';
import { Submission, SubmissionDocument } from '../submissions/submission.schema';
import { ReviewFormsService } from '../review-forms/review-forms.service';
import { SubmissionsService } from '../submissions/submissions.service';
import { AiEvaluation, AiEvaluationDocument } from './ai-evaluation.schema';
import { AiClientService, AiEvaluatePayload, AiEvaluateResponse } from './ai-client.service';
import { ApproveAiEvaluationDto, RunAiEvaluationDto } from './ai-evaluations.dto';

type PreparedRun = {
  email: string;
  name: string;
  forms: any[];
  enrichedSubs: AiEvaluatePayload['submissions'];
  roleLevel: string;
  track: string;
  pending: AiEvaluationDocument;
  aiPayload: AiEvaluatePayload;
};

@Injectable()
export class AiEvaluationsService {
  constructor(
    @InjectModel(AiEvaluation.name) private aiModel: Model<AiEvaluationDocument>,
    @InjectModel(Submission.name) private submissionModel: Model<SubmissionDocument>,
    @InjectModel(ReviewForm.name) private formModel: Model<ReviewFormDocument>,
    private aiClient: AiClientService,
    private formsService: ReviewFormsService,
    private submissionsService: SubmissionsService,
  ) {}

  private async prepareRun(dto: RunAiEvaluationDto): Promise<PreparedRun> {
    const email = dto.revieweeEmail.trim().toLowerCase();
    const name = dto.revieweeName.trim();

    if (!dto.formIds?.length) {
      throw new BadRequestException('At least one review form must be selected');
    }

    const forms = await this.formModel.find({ _id: { $in: dto.formIds } }).lean();
    if (!forms.length) throw new BadRequestException('No matching review forms');

    const formIds = forms.map((f) => f._id);
    const query: Record<string, unknown> = {
      formId: { $in: formIds },
      $or: [{ revieweeEmail: email }, { revieweeName: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }],
    };

    const dateFilter: Record<string, Date> = {};
    if (dto.dateFrom) dateFilter.$gte = new Date(dto.dateFrom);
    if (dto.dateTo) {
      const end = new Date(dto.dateTo);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
    if (Object.keys(dateFilter).length) query.submittedAt = dateFilter;

    const rawSubs = await this.submissionModel.find(query).sort({ submittedAt: -1 }).lean();
    if (!rawSubs.length) {
      throw new BadRequestException('No submissions found for this reviewee in the selected scope');
    }

    const enrichedSubs = await Promise.all(
      rawSubs.map(async (s) => {
        const form = forms.find((f) => String(f._id) === String(s.formId)) ?? (await this.formsService.getByCode(s.formCode));
        const listed = await this.submissionsService.listByForm(s.formCode);
        const match = listed.find((x: any) => String(x._id) === String(s._id));
        return {
          id: String(s._id),
          formCode: s.formCode,
          formTitle: (form as any)?.title ?? s.formCode,
          reviewerName: s.reviewerName,
          reviewerEmail: s.reviewerEmail,
          totalScore: s.totalScore,
          submittedAt: s.submittedAt.toISOString(),
          dimensionScores: (match as any)?.dimensionScores ?? [],
          responseDetails: (match as any)?.responseDetails ?? [],
        };
      }),
    );

    const roleLevel = dto.currentRoleLevel ?? forms[0]?.role ?? 'mid';
    const track = dto.track ?? 'fullstack';

    const pending = await this.aiModel.create({
      revieweeEmail: email,
      revieweeName: name,
      sourceFormCodes: forms.map((f) => f.code),
      includedSubmissionIds: rawSubs.map((s) => s._id),
      status: 'processing',
    });

    const aiPayload: AiEvaluatePayload = {
      employee: {
        revieweeName: name,
        revieweeEmail: email,
        currentRoleLevel: roleLevel,
        track,
      },
      submissions: enrichedSubs,
    };

    return { email, name, forms, enrichedSubs, roleLevel, track, pending, aiPayload };
  }

  private applyAiResult(pendingId: Types.ObjectId, forms: any[], enrichedSubs: any[], dto: RunAiEvaluationDto, aiResult: AiEvaluateResponse) {
    return this.aiModel.findByIdAndUpdate(
      pendingId,
      {
        $set: {
          status: 'completed',
          inputSnapshot: {
            submissionCount: enrichedSubs.length,
            formCodes: forms.map((f) => f.code),
            dateFrom: dto.dateFrom,
            dateTo: dto.dateTo,
          },
          aiSummary: aiResult.summary,
          employeeFacingSummary: aiResult.employeeFacingSummary,
          managerOnlySummary: aiResult.managerOnlySummary,
          strengths: aiResult.strengths ?? [],
          improvementAreas: aiResult.improvementAreas ?? [],
          aboveRoleSignals: aiResult.aboveRoleSignals ?? [],
          riskPatterns: aiResult.riskPatterns ?? [],
          biasWarnings: aiResult.biasWarnings ?? [],
          missingEvidence: aiResult.missingEvidence ?? [],
          scoreInconsistencies: aiResult.scoreInconsistencies ?? [],
          developmentPlan: aiResult.developmentPlan,
          managerTalkingPoints: aiResult.managerTalkingPoints ?? [],
          finalDecisionRecommendation: aiResult.finalDecisionRecommendation,
          safetyFlags: aiResult.safetyFlags ?? [],
          recommendedBand: aiResult.recommendedBand,
          roleBasedScore: aiResult.roleBasedScore,
          calibratedScore: aiResult.calibratedScore,
          confidenceScore: aiResult.confidenceScore,
          evidenceStrength: aiResult.evidenceStrength,
          performanceSection: aiResult.performanceSection,
          behavioralSection: aiResult.behavioralSection,
          insightsSection: aiResult.insightsSection,
        },
      },
      { new: true },
    );
  }

  async runEvaluation(dto: RunAiEvaluationDto, _userId: string) {
    const { pending, forms, enrichedSubs, aiPayload } = await this.prepareRun(dto);

    try {
      const aiResult = await this.aiClient.evaluatePerformance(aiPayload);
      return this.applyAiResult(pending._id, forms, enrichedSubs, dto, aiResult);
    } catch (err: any) {
      await this.aiModel.findByIdAndUpdate(pending._id, {
        $set: { status: 'failed', errorMessage: err?.message ?? 'AI evaluation failed' },
      });
      throw err;
    }
  }

  async runEvaluationStream(
    dto: RunAiEvaluationDto,
    _userId: string,
    onEvent: (event: Record<string, unknown>) => void,
  ) {
    const { pending, forms, enrichedSubs, aiPayload } = await this.prepareRun(dto);

    try {
      let finalResult: AiEvaluateResponse | null = null;

      for await (const event of this.aiClient.evaluatePerformanceStream(aiPayload)) {
        onEvent(event);
        if (event.event === 'complete' && event.data) {
          finalResult = event.data as AiEvaluateResponse;
        }
        if (event.event === 'error') {
          throw new BadRequestException(String(event.message ?? 'AI stream failed'));
        }
      }

      if (!finalResult) {
        throw new BadRequestException('AI stream ended without a complete result');
      }

      const saved = await this.applyAiResult(pending._id, forms, enrichedSubs, dto, finalResult);
      onEvent({
        event: 'saved',
        evaluationId: String(saved?._id),
        data: saved,
        message: 'Evaluation saved',
      });
      return saved;
    } catch (err: any) {
      await this.aiModel.findByIdAndUpdate(pending._id, {
        $set: { status: 'failed', errorMessage: err?.message ?? 'AI evaluation failed' },
      });
      throw err;
    }
  }

  async listCompleted(options?: { formCodes?: string[]; limit?: number }) {
    const filter: Record<string, unknown> = { status: 'completed' };
    if (options?.formCodes?.length) {
      filter.sourceFormCodes = { $in: options.formCodes };
    }

    const docs = await this.aiModel
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(options?.limit ?? 300)
      .lean();

    const latestByEmail = new Map<string, (typeof docs)[number]>();
    for (const doc of docs) {
      const email = String(doc.revieweeEmail ?? '').trim().toLowerCase();
      if (!email || latestByEmail.has(email)) continue;
      latestByEmail.set(email, doc);
    }

    return Array.from(latestByEmail.values()).sort((a, b) =>
      String(b.updatedAt ?? b.createdAt ?? '').localeCompare(String(a.updatedAt ?? a.createdAt ?? '')),
    );
  }

  async findById(id: string) {
    const doc = await this.aiModel.findById(id).lean();
    if (!doc) throw new NotFoundException('AI evaluation not found');
    return doc;
  }

  async approve(id: string, dto: ApproveAiEvaluationDto, userId: string) {
    const doc = await this.aiModel.findById(id);
    if (!doc) throw new NotFoundException('AI evaluation not found');
    if (doc.status !== 'completed') throw new BadRequestException('Only completed evaluations can be approved');

    doc.approvedByManager = true;
    doc.approvedAt = new Date();
    doc.approvedBy = new Types.ObjectId(userId);
    if (dto.managerEditedSummary) doc.managerEditedSummary = dto.managerEditedSummary;
    await doc.save();

    return doc;
  }
}
