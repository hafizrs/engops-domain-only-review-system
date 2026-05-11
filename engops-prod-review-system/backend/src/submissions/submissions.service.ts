import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ReviewFormsService } from '../review-forms/review-forms.service';
import { Submission, SubmissionDocument } from './submission.schema';
type ResponseDetail = {
  dimensionKey: string;
  dimensionLabel: string;
  questionId: string;
  questionText: string;
  score: number;
  /** Full 0–5 option texts from the form (same order as manager UI). */
  options: string[];
  selectedOptionText: string;
};

type DimensionScoreRow = {
  dimensionKey: string;
  dimensionLabel: string;
  weight: number;
  /** Mean of 0–5 answers in this section. */
  averageOutOf5: number;
  /** 0–100 scale position for this section’s average. */
  percentOfScale: number;
  /** Points toward the overall /100 score from this dimension. */
  weightedContribution: number;
};

@Injectable()
export class SubmissionsService {
  constructor(@InjectModel(Submission.name) private model: Model<SubmissionDocument>, private forms: ReviewFormsService) {}
  async submit(
    code: string,
    dto: { answers: Record<string, number>; totalScore: number; revieweeName: string; revieweeEmail?: string },
    user: { sub: string; email: string; name: string; role: string },
  ) {
    if (user.role !== 'manager') throw new ForbiddenException('Only managers can submit a review');
    const form: any = await this.forms.getByCode(code);
    const revieweeName = (dto.revieweeName || '').trim();
    if (!revieweeName) throw new BadRequestException('Reviewee name is required');
    const exists = await this.model.exists({ formId: form._id, reviewerEmail: user.email.toLowerCase(), revieweeName: revieweeName.toLowerCase() });
    if (exists) throw new ConflictException('You have already submitted a review for this person');
    try {
      return await this.model.create({
        formId: form._id,
        formCode: code,
        reviewerName: user.name || user.email,
        reviewerEmail: user.email.toLowerCase(),
        revieweeName,
        revieweeEmail: dto.revieweeEmail?.trim().toLowerCase() || undefined,
        answers: dto.answers,
        totalScore: dto.totalScore,
        submittedAt: new Date(),
        submittedBy: new Types.ObjectId(user.sub),
      });
    } catch (err: any) {
      if (err && (err.code === 11000 || err.message?.includes('E11000'))) {
        throw new ConflictException('You have already submitted a review for this person');
      }
      throw err;
    }
  }
  private responseDetailsForSubmission(form: any, submission: any): ResponseDetail[] {
    const dims = form?.questions?.dims ?? [];
    const answers = (submission.answers ?? {}) as Record<string, number>;
    const out: ResponseDetail[] = [];
    for (const d of dims) {
      for (const q of d.questions ?? []) {
        const raw = answers[q.id];
        const score = typeof raw === 'number' && raw >= 0 && raw <= 5 ? raw : -1;
        const opts = q.opts as string[] | undefined;
        const selectedOptionText =
          score >= 0 && opts && opts[score] !== undefined ? opts[score] : '—';
        out.push({
          dimensionKey: d.key,
          dimensionLabel: d.label,
          questionId: q.id,
          questionText: q.text,
          score,
          options: opts ?? [],
          selectedOptionText,
        });
      }
    }
    return out;
  }

  private dimensionScoresForSubmission(form: any, submission: any): DimensionScoreRow[] {
    const dims = form?.questions?.dims ?? [];
    const answers = (submission.answers ?? {}) as Record<string, number>;
    return dims.map((d: any) => {
      const qs = d.questions ?? [];
      let dSum = 0;
      for (const q of qs) {
        const v = answers[q.id];
        dSum += typeof v === 'number' ? v : 0;
      }
      const n = qs.length || 1;
      const avg = dSum / n;
      const weight = typeof d.weight === 'number' ? d.weight : 0;
      const weightedContribution = (avg / 5) * weight;
      return {
        dimensionKey: d.key,
        dimensionLabel: d.label,
        weight,
        averageOutOf5: Math.round(avg * 10) / 10,
        percentOfScale: Math.round((avg / 5) * 100),
        weightedContribution: Math.round(weightedContribution * 10) / 10,
      };
    });
  }

  /** Adds `responseDetails` (each question) and `dimensionScores` (each section), derived from answers + form. */
  async listByForm(code: string): Promise<Record<string, unknown>[]> {
    const form = await this.forms.getByCode(code);
    const subs = await this.model.find({ formCode: code }).sort({ submittedAt: -1 }).lean();
    return subs.map((s) => ({
      ...s,
      responseDetails: this.responseDetailsForSubmission(form, s),
      dimensionScores: this.dimensionScoresForSubmission(form, s),
    })) as Record<string, unknown>[];
  }
}
