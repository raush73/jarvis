import { execSync } from 'child_process';
import type { ReportItem } from './generate-report';

const LISTEN_COMMAND = 'ss -lntp';

function parseListeningPorts(output: string): Set<number> {
  const ports = new Set<number>();
  const lines = output.split('\n');
  for (const line of lines) {
    if (!line.includes('LISTEN')) {
      continue;
    }
    const parts = line.trim().split(/\s+/);
    if (parts.length < 4) {
      continue;
    }
    const localAddress = parts[3];
    const portText = localAddress.split(':').pop() ?? '';
    const port = Number.parseInt(portText, 10);
    if (!Number.isNaN(port)) {
      ports.add(port);
    }
  }
  return ports;
}

export function checkListeners(expectedPorts: number[]): {
  items: ReportItem[];
  raw: string;
} {
  const output = execSync(LISTEN_COMMAND, { encoding: 'utf-8' });
  const listeningPorts = parseListeningPorts(output);

  const items: ReportItem[] = expectedPorts.map((port) => {
    const isListening = listeningPorts.has(port);
    return {
      label: `${port}`,
      status: isListening ? 'PASS' : 'FAIL',
      severity: isListening ? 'LOW' : 'HIGH',
      details: isListening ? 'Listening' : 'Missing listener',
    };
  });

  return { items, raw: output };
}
