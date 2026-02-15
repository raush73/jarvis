import { execSync } from 'child_process';
import * as fs from 'fs';
import type { ReportItem } from './generate-report';

interface CurlResult {
  status: number;
  body: string;
  raw: string;
  error?: string;
}

function runCurl(url: string, method: 'GET' | 'HEAD'): CurlResult {
  const methodArg = method === 'HEAD' ? '-I' : '';
  const command = `curl -s ${methodArg} -o - -w "\\nHTTP_STATUS:%{http_code}\\n" "${url}"`;
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

function detectNginxError(body: string, status: number): boolean {
  if (status >= 500) {
    return true;
  }
  return status >= 400 && /nginx/i.test(body);
}

function parseJson(body: string): Record<string, unknown> | null {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

export function checkProxyRouting(): {
  items: ReportItem[];
  raw: string;
} {
  const health = runCurl('http://127.0.0.1/api/health', 'GET');
  const auth = runCurl('http://127.0.0.1/api/auth/login', 'HEAD');

  const healthJson = parseJson(health.body);
  const healthOk =
    health.status === 200 &&
    !!healthJson &&
    healthJson.ok === true &&
    !detectNginxError(health.body, health.status);

  const authOk =
    auth.status > 0 &&
    auth.status !== 404 &&
    auth.status < 500 &&
    !detectNginxError(auth.body, auth.status);

  const items: ReportItem[] = [
    {
      label: '/api/health',
      status: healthOk ? 'PASS' : 'FAIL',
      severity: healthOk ? 'LOW' : 'HIGH',
      details: health.error
        ? `Curl error: ${health.error}`
        : `HTTP ${health.status}`,
    },
    {
      label: '/api/auth/login (HEAD)',
      status: authOk ? 'PASS' : 'FAIL',
      severity: authOk ? 'LOW' : 'HIGH',
      details: auth.error
        ? `Curl error: ${auth.error}`
        : `HTTP ${auth.status}`,
    },
  ];

  const raw = [health.raw, auth.raw].filter(Boolean).join('\n');
  return { items, raw };
}

export function checkNginxStatus(): {
  items: ReportItem[];
  raw: string;
} {
  let processOutput = '';
  try {
    processOutput = execSync('ps -ef', { encoding: 'utf-8' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    processOutput = `ps error: ${message}`;
  }

  const hasNginxProcess = /nginx/.test(processOutput);
  const nginxConfigExists = fs.existsSync('/etc/nginx/nginx.conf');
  let versionOutput = '';

  try {
    versionOutput = execSync('nginx -v', { encoding: 'utf-8', stdio: 'pipe' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    versionOutput = `nginx -v error: ${message}`;
  }

  const items: ReportItem[] = [
    {
      label: 'nginx process',
      status: hasNginxProcess ? 'PASS' : 'FAIL',
      severity: hasNginxProcess ? 'LOW' : 'MED',
      details: hasNginxProcess ? 'Running' : 'No nginx process detected',
    },
    {
      label: 'nginx config',
      status: nginxConfigExists ? 'PASS' : 'FAIL',
      severity: nginxConfigExists ? 'LOW' : 'MED',
      details: nginxConfigExists
        ? '/etc/nginx/nginx.conf exists'
        : 'nginx.conf missing',
    },
  ];

  const raw = [processOutput, versionOutput].filter(Boolean).join('\n');
  return { items, raw };
}
