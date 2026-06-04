import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { AiClientService } from './ai-client.service';
import { AiEvaluationsService } from './ai-evaluations.service';
import { ApproveAiEvaluationDto, RunAiEvaluationDto } from './ai-evaluations.dto';

@Controller('ai-evaluations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AiEvaluationsController {
  constructor(
    private readonly service: AiEvaluationsService,
    private readonly aiClient: AiClientService,
  ) {}

  @Get('health')
  async aiHealth() {
    const ok = await this.aiClient.healthCheck();
    return { aiService: ok ? 'up' : 'down' };
  }

  @Post('run')
  run(@Body() dto: RunAiEvaluationDto, @Req() req: any) {
    return this.service.runEvaluation(dto, req.user.sub);
  }

  @Post('run/stream')
  async runStream(@Body() dto: RunAiEvaluationDto, @Req() req: any, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      await this.service.runEvaluationStream(dto, req.user.sub, (event) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      });
      res.end();
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ event: 'error', message: err?.message ?? 'Stream failed' })}\n\n`);
      res.end();
    }
  }

  @Get()
  list(@Query('formCodes') formCodes?: string) {
    const codes = formCodes
      ? formCodes
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
      : undefined;
    return this.service.listCompleted({ formCodes: codes });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveAiEvaluationDto, @Req() req: any) {
    return this.service.approve(id, dto, req.user.sub);
  }
}
