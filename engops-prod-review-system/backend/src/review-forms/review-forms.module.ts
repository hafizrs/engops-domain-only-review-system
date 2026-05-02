import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewForm, ReviewFormSchema } from './review-form.schema';
import { ReviewFormsController } from './review-forms.controller';
import { ReviewFormsService } from './review-forms.service';
import { AuthModule } from '../auth/auth.module';
@Module({ imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: ReviewForm.name, schema: ReviewFormSchema },])
],
controllers: [ReviewFormsController],
providers: [ReviewFormsService, JwtService],
exports: [ReviewFormsService] })
export class ReviewFormsModule {}
