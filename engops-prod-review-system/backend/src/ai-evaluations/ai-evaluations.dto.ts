import {
  IsArray,
  IsEmail,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** Matches AI Evaluation Setup in the frontend: forms + date range + reviewee. */
export class RunAiEvaluationDto {
  @IsString()
  @MaxLength(200)
  revieweeName: string;

  @IsEmail()
  revieweeEmail: string;

  @IsArray()
  @IsMongoId({ each: true })
  formIds: string[];

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  currentRoleLevel?: string;

  @IsOptional()
  @IsString()
  track?: string;
}

export class ApproveAiEvaluationDto {
  @IsOptional()
  @IsString()
  managerEditedSummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  managerNote?: string;
}
