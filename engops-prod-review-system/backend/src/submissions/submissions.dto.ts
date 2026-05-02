import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
export class CreateSubmissionDto {
  @IsObject() answers: Record<string, number>;
  @IsNumber() totalScore: number;
  @IsString() @IsNotEmpty() revieweeName: string;
  @IsString() @IsOptional() revieweeEmail?: string;
}
