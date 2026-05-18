const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export type AiEvalStreamEvent = {
  event: string;
  node?: string;
  label?: string;
  section?: string;
  data?: unknown;
  message?: string;
  evaluationId?: string;
};

export async function streamAiEvaluationRun(
  body: Record<string, unknown>,
  onEvent: (event: AiEvalStreamEvent) => void
): Promise<void> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/ai-evaluations/run/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const parsed = JSON.parse(text);
      message = parsed.message ?? parsed.detail ?? text;
    } catch {
      /* use raw text */
    }
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  if (!res.body) throw new Error('Empty stream response');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith('data:')) continue;
      const json = line.replace(/^data:\s*/, '');
      if (!json) continue;
      try {
        onEvent(JSON.parse(json) as AiEvalStreamEvent);
      } catch {
        /* skip malformed chunk */
      }
    }
  }
}
