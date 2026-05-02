import { IsNotEmpty, IsObject, IsString } from 'class-validator';
export class CreateReviewFormDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() role: string;
  @IsObject() questions: Record<string, any>;
}
