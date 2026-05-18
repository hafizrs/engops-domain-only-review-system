import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ReviewForm, ReviewFormSchema } from '../review-forms/review-form.schema';
import { ReviewFormsModule } from '../review-forms/review-forms.module';
import { Submission, SubmissionSchema } from '../submissions/submission.schema';
import { SubmissionsModule } from '../submissions/submissions.module';
import { AiEvaluation, AiEvaluationSchema } from './ai-evaluation.schema';
import { AiClientService } from './ai-client.service';
import { AiEvaluationsController } from './ai-evaluations.controller';
import { AiEvaluationsService } from './ai-evaluations.service';

@Module({
  imports: [
    AuthModule,
    ReviewFormsModule,
    SubmissionsModule,
    MongooseModule.forFeature([
      { name: AiEvaluation.name, schema: AiEvaluationSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: ReviewForm.name, schema: ReviewFormSchema },
    ]),
  ],
  controllers: [AiEvaluationsController],
  providers: [AiEvaluationsService, AiClientService, JwtService],
  exports: [AiEvaluationsService, AiClientService],
})
export class AiEvaluationsModule {}
