import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { customAlphabet } from 'nanoid';
import { ReviewForm, ReviewFormDocument } from './review-form.schema';
import { CreateReviewFormDto } from './review-forms.dto';
const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);
@Injectable()
export class ReviewFormsService {
  constructor(@InjectModel(ReviewForm.name) private model: Model<ReviewFormDocument>) {}
  async create(dto: CreateReviewFormDto, userId: string) {
    let code = nanoid();
    while (await this.model.exists({ code })) code = nanoid();
    return this.model.create({ ...dto, code, createdBy: new Types.ObjectId(userId) });
  }
  list() { return this.model.find().sort({ createdAt: -1 }).lean(); }
  async getByCode(code: string) {
    const form = await this.model.findOne({ code, isActive: true }).lean();
    if (!form) throw new NotFoundException('Review link not found');
    return form;
  }
}
