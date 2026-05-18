import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ReviewFormsModule } from '../review-forms/review-forms.module';
import { Submission, SubmissionSchema } from './submission.schema';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
@Module({
  imports: [AuthModule, ReviewFormsModule, MongooseModule.forFeature([{ name: Submission.name, schema: SubmissionSchema }])],
  controllers: [SubmissionsController],
  providers: [SubmissionsService, JwtService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
