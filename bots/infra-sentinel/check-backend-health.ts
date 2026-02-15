import { execSync } from 'child_process';
import type { ReportItem } from './generate-report';

interface CurlResult {
  status: number;
  body: string;
  raw: string;
  error?: string;
}

function runCurl(url: string): CurlResult {
  const command = `curl -s -o - -w "\\nHTTP_STATUS:%{http_code}\\n" "${url}"`;
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    const marker = '\nHTTP_STATUS:';
    const index = output.lastIndexOf(marker);
    const body = index >= 0 ? output.slice(0, index) : output;
    const statusText =
      index >= 0 ? output.slice(index + marker.length).trim() : '0';
    const status = Number.parseInt(statusText, 10) || 0;
    return { status, body, raw: output };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: 0, body: '', raw: '', error: message };
  }
}

function parseJson(body: string): Record<string, unknown> | null {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

export function checkBackendHealth(): {
  items: ReportItem[];
  raw: string;
  missingEndpoints: string[];
} {
  const prod = runCurl('http://127.0.0.1:3000/health');
  const training = runCurl('http://127.0.0.1:3002/health');

  const prodJson = parseJson(prod.body);
  const trainingJson = parseJson(training.body);

  const prodOk = prod.status === 200 && prodJson?.ok === true;
  const trainingOk = training.status === 200 && trainingJson?.ok === true;

  const items: ReportItem[] = [
    {
      label: 'prod backend (3000)',
      status: prodOk ? 'PASS' : 'FAIL',
      severity: prodOk ? 'LOW' : 'HIGH',
      details: prod.error ? `Curl error: ${prod.error}` : `HTTP ${prod.status}`,
    },
    {
      label: 'training backend (3002)',
      status: trainingOk ? 'PASS' : 'FAIL',
      severity: trainingOk ? 'LOW' : 'HIGH',
      details: training.error
        ? `Curl error: ${training.error}`
        : `HTTP ${training.status}`,
    },
  ];

  const missingEndpoints: string[] = [];
  if (prod.status === 404 || prod.status === 0) {
    missingEndpoints.push('prod backend /health');
  }
  if (training.status === 404 || training.status === 0) {
    missingEndpoints.push('training backend /health');
  }

  const raw = [prod.raw, training.raw].filter(Boolean).join('\n');
  return { items, raw, missingEndpoints };
}
