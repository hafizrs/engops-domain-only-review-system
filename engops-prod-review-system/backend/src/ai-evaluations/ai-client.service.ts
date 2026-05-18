import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type AiEvaluatePayload = {
  employee: {
    revieweeName: string;
    revieweeEmail: string;
    currentRoleLevel: string;
    track: string;
  };
  cycle?: { id: string; name: string };
  submissions: Array<{
    id: string;
    formCode: string;
    formTitle: string;
    reviewerName: string;
    reviewerEmail: string;
    totalScore: number;
    submittedAt: string;
    dimensionScores: Array<{
      dimensionKey: string;
      dimensionLabel: string;
      averageOutOf5: number;
      percentOfScale: number;
    }>;
    responseDetails: Array<{
      dimensionKey: string;
      dimensionLabel: string;
      questionText: string;
      score: number;
      selectedOptionText: string;
    }>;
  }>;
};

export type AiEvaluateResponse = Record<string, unknown>;

export type AiStreamEvent = {
  event: string;
  node?: string;
  label?: string;
  section?: string;
  data?: unknown;
  message?: string;
};

@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);

  constructor(private config: ConfigService) {}

  async evaluatePerformance(payload: AiEvaluatePayload): Promise<AiEvaluateResponse> {
    const baseUrl = this.config.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
    const secret = this.config.get<string>('AI_SERVICE_SECRET', 'dev-ai-secret');

    const url = `${baseUrl.replace(/\/$/, '')}/ai/performance/evaluate`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AI-Service-Secret': secret,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        this.logger.error(`AI service error ${res.status}: ${text}`);
        throw new ServiceUnavailableException(`AI service returned ${res.status}`);
      }

      return (await res.json()) as AiEvaluateResponse;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new ServiceUnavailableException('AI service request timed out');
      }
      if (err instanceof ServiceUnavailableException) throw err;
      this.logger.error(`AI service unreachable at ${url}: ${err?.message}`);
      throw new ServiceUnavailableException(
        `AI service is not available at ${baseUrl}. Check AI_SERVICE_URL and that uvicorn is running.`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async *evaluatePerformanceStream(payload: AiEvaluatePayload): AsyncGenerator<AiStreamEvent> {
    const baseUrl = this.config.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
    const secret = this.config.get<string>('AI_SERVICE_SECRET', 'dev-ai-secret');
    const url = `${baseUrl.replace(/\/$/, '')}/ai/performance/evaluate/stream`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AI-Service-Secret': secret,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`AI stream error ${res.status}: ${text}`);
      throw new ServiceUnavailableException(`AI service returned ${res.status}`);
    }

    if (!res.body) {
      throw new ServiceUnavailableException('AI service stream body is empty');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';
        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith('data:')) continue;
          const json = line.replace(/^data:\s*/, '');
          if (!json) continue;
          try {
            yield JSON.parse(json) as AiStreamEvent;
          } catch {
            this.logger.warn(`Skipping invalid SSE JSON: ${json.slice(0, 120)}`);
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`AI stream read failed: ${err?.message}`);
      throw new ServiceUnavailableException('AI service stream failed');
    }
  }

  async healthCheck(): Promise<boolean> {
    const baseUrl = this.config.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/health`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  }
}
