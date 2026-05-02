import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CreateReviewFormDto } from './review-forms.dto';
import { ReviewFormsService } from './review-forms.service';
@Controller('review-forms')
export class ReviewFormsController {
  constructor(private service: ReviewFormsService) {}
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin') @Post() create(@Body() dto: CreateReviewFormDto, @Req() req: any) { return this.service.create(dto, req.user.sub); }
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin') @Get() list() { return this.service.list(); }
  /** Public: managers open this before login to load question config. */
  @Get('code/:code') getPublic(@Param('code') code: string) {
    return this.service.getByCode(code);
  }
}
