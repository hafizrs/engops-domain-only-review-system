import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CreateSubmissionDto } from './submissions.dto';
import { SubmissionsService } from './submissions.service';
@Controller('submissions')
export class SubmissionsController {
  constructor(private service: SubmissionsService) {}
  @UseGuards(JwtAuthGuard) @Post(':code') submit(@Param('code') code: string, @Body() dto: CreateSubmissionDto, @Req() req: any) { return this.service.submit(code, dto, req.user); }
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin') @Get('form/:code') list(@Param('code') code: string) { return this.service.listByForm(code); }
}
