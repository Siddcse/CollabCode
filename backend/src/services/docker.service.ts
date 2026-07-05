import Docker from 'dockerode';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import type { SupportedLanguage } from '@collabcode/shared';

const isWindows = os.platform() === 'win32';

// ── Try multiple Docker socket paths (Windows has several) ───────────────────
function createDockerClient(): Docker {
  if (isWindows) {
    // Try named pipe paths in order of preference
    const paths = [
      env.DOCKER_SOCKET_PATH,           // from .env (default: //./pipe/docker_engine)
      '//./pipe/docker_engine',
      '//./pipe/dockerDesktopLinuxEngine',
    ];
    // Use the configured one (dockerode will fail gracefully at ping time)
    return new Docker({ socketPath: paths[0] });
  }
  return new Docker({ socketPath: '/var/run/docker.sock' });
}

const docker = createDockerClient();

const DOCKER_IMAGES: Record<SupportedLanguage, string> = {
  javascript: 'node:22-alpine',
  typescript: 'node:22-alpine',
  python:     'python:3.12-slim',
  java:       'eclipse-temurin:21-jdk-alpine',
  c:          'gcc:13',
  cpp:        'gcc:13',
  go:         'golang:1.22-alpine',
  rust:       'rust:1.78-slim',
};

const RUN_COMMANDS: Record<SupportedLanguage, (file: string) => string[]> = {
  // Node 22 natively strips TypeScript types — no network/npx needed
  javascript: (f) => ['node', f],
  typescript: (f) => ['node', '--experimental-strip-types', f],
  python:     (f) => ['python3', f],
  // Compiled languages: output goes to /tmp (writable), source at /code (readonly)
  java:       (_) => ['sh', '-c', 'javac -d /tmp /code/Main.java && java -cp /tmp Main'],
  c:          (_) => ['sh', '-c', 'gcc -o /tmp/prog /code/main.c && /tmp/prog'],
  cpp:        (_) => ['sh', '-c', 'g++ -o /tmp/prog /code/main.cpp && /tmp/prog'],
  go:         (f) => ['go', 'run', f],
  rust:       (_) => ['sh', '-c', 'rustc -o /tmp/prog /code/main.rs && /tmp/prog'],
};

const FILE_NAMES: Record<SupportedLanguage, string> = {
  javascript: 'main.js',
  typescript: 'main.ts',
  python:     'main.py',
  java:       'Main.java',
  c:          'main.c',
  cpp:        'main.cpp',
  go:         'main.go',
  rust:       'main.rs',
};

// ── Local fallback commands (when Docker is unavailable) ─────────────────────
// Maps language → [executable, ...args] using host-installed runtimes
const LOCAL_COMMANDS: Record<SupportedLanguage, (dir: string, file: string) => { cmd: string; args: string[]; shell?: boolean }> = {
  javascript: (_, f) => ({ cmd: 'node', args: [f] }),
  typescript: (_, f) => ({ cmd: 'node', args: ['--loader', 'ts-node/esm', f] }),
  python:     (_, f) => ({ cmd: isWindows ? 'python' : 'python3', args: [f] }),
  java:       (dir, _) => ({
    cmd: isWindows ? 'cmd' : 'sh',
    args: isWindows
      ? ['/c', `cd /d "${dir}" && javac Main.java && java Main`]
      : ['-c', `cd "${dir}" && javac Main.java && java Main`],
  }),
  c: (dir, _) => ({
    cmd: isWindows ? 'cmd' : 'sh',
    args: isWindows
      ? ['/c', `cd /d "${dir}" && gcc -o prog main.c && prog.exe`]
      : ['-c', `cd "${dir}" && gcc -o prog main.c && ./prog`],
  }),
  cpp: (dir, _) => ({
    cmd: isWindows ? 'cmd' : 'sh',
    args: isWindows
      ? ['/c', `cd /d "${dir}" && g++ -o prog main.cpp && prog.exe`]
      : ['-c', `cd "${dir}" && g++ -o prog main.cpp && ./prog`],
  }),
  go:   (_, f) => ({ cmd: 'go', args: ['run', f] }),
  rust: (dir, _) => ({
    cmd: isWindows ? 'cmd' : 'sh',
    args: isWindows
      ? ['/c', `cd /d "${dir}" && rustc -o prog main.rs && prog.exe`]
      : ['-c', `cd "${dir}" && rustc -o prog main.rs && ./prog`],
  }),
};

export interface RunResult {
  output: string;
  error: string;
  exitCode: number;
  executionTimeMs: number;
  memoryUsageMb: number;
}

// ── Main entry: try Docker → fallback to local process ───────────────────────
export async function runCode(language: SupportedLanguage, code: string): Promise<RunResult> {
  const dockerHealthy = await checkDockerHealth();
  if (dockerHealthy) {
    return runInDocker(language, code);
  }
  console.warn('⚠️  Docker unavailable — running code locally (no sandbox)');
  return runLocally(language, code);
}

// ── Docker execution ─────────────────────────────────────────────────────────
async function runInDocker(language: SupportedLanguage, code: string): Promise<RunResult> {
  const start = Date.now();
  const tmpDir = path.join(os.tmpdir(), `collabcode-${uuidv4()}`);
  let container: Docker.Container | null = null;

  try {
    await fs.mkdir(tmpDir, { recursive: true });
    const fileName = FILE_NAMES[language];
    await fs.writeFile(path.join(tmpDir, fileName), code, 'utf8');

    const image = DOCKER_IMAGES[language];
    const cmd = RUN_COMMANDS[language](fileName);

    // Convert Windows backslash paths to forward slashes for Docker
    const bindPath = tmpDir.replace(/\\/g, '/');

    container = await docker.createContainer({
      Image: image,
      Cmd: cmd,
      WorkingDir: '/code',
      NetworkDisabled: true,
      HostConfig: {
        Binds: [`${bindPath}:/code:ro`],
        Memory: env.EXECUTION_MEMORY_LIMIT,
        CpuQuota: env.EXECUTION_CPU_QUOTA,
        AutoRemove: false,
        // ReadonlyRootfs removed — compiled languages (C/C++/Java/Rust) need
        // to write binaries to /tmp. Security is maintained via CapDrop + no-new-privileges.
        Tmpfs: { '/tmp': 'size=64m,noexec=0' },  // writable /tmp for compiled output
        CapDrop: ['ALL'],
        SecurityOpt: ['no-new-privileges'],
      },
    });

    await container.start();

    const timeoutHandle = setTimeout(async () => {
      try { await container?.stop({ t: 0 }); } catch {}
    }, env.EXECUTION_TIMEOUT_MS);

    const exitData = await container.wait();
    clearTimeout(timeoutHandle);

    const logs = await container.logs({ stdout: true, stderr: true, follow: false });
    const { stdout, stderr } = parseLogs(logs as unknown as Buffer);
    const stats = await container.stats({ stream: false }) as { memory_stats?: { usage?: number } };
    const memoryMb = (stats?.memory_stats?.usage ?? 0) / (1024 * 1024);

    return {
      output: stdout,
      error: stderr,
      exitCode: exitData.StatusCode,
      executionTimeMs: Date.now() - start,
      memoryUsageMb: Math.round(memoryMb * 100) / 100,
    };
  } finally {
    if (container) {
      try { await container.remove({ force: true }); } catch {}
    }
    try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

// ── Local process execution (fallback — no Docker needed) ────────────────────
async function runLocally(language: SupportedLanguage, code: string): Promise<RunResult> {
  const start = Date.now();
  const tmpDir = path.join(os.tmpdir(), `collabcode-local-${uuidv4()}`);

  try {
    await fs.mkdir(tmpDir, { recursive: true });
    const fileName = FILE_NAMES[language];
    const filePath = path.join(tmpDir, fileName);
    await fs.writeFile(filePath, code, 'utf8');

    const { cmd, args } = LOCAL_COMMANDS[language](tmpDir, filePath);

    return await new Promise<RunResult>((resolve) => {
      let stdout = '';
      let stderr = '';

      const proc = spawn(cmd, args, {
        cwd: tmpDir,
        timeout: env.EXECUTION_TIMEOUT_MS,
        shell: isWindows,
      });

      proc.stdout?.on('data', (d: Buffer) => { stdout += d.toString(); });
      proc.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); });

      proc.on('close', (exitCode) => {
        resolve({
          output: stdout,
          error: stderr,
          exitCode: exitCode ?? 1,
          executionTimeMs: Date.now() - start,
          memoryUsageMb: 0,
        });
      });

      proc.on('error', (err) => {
        resolve({
          output: '',
          error: `Could not run ${language}: ${err.message}\n\nMake sure the runtime is installed:\n${getRuntimeHint(language)}`,
          exitCode: 1,
          executionTimeMs: Date.now() - start,
          memoryUsageMb: 0,
        });
      });
    });
  } finally {
    try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

function getRuntimeHint(lang: SupportedLanguage): string {
  const hints: Record<SupportedLanguage, string> = {
    javascript: 'Node.js: https://nodejs.org',
    typescript: 'Node.js + tsx: npm install -g tsx',
    python:     'Python: https://python.org',
    java:       'JDK: https://adoptium.net',
    c:          'GCC: Install MinGW or WSL on Windows',
    cpp:        'G++: Install MinGW or WSL on Windows',
    go:         'Go: https://go.dev',
    rust:       'Rust: https://rustup.rs',
  };
  return hints[lang];
}

// ── Log parser (Docker multiplexed stream format) ────────────────────────────
function parseLogs(buffer: Buffer): { stdout: string; stderr: string } {
  let stdout = '';
  let stderr = '';
  let offset = 0;

  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) break;
    const streamType = buffer[offset];
    const size = buffer.readUInt32BE(offset + 4);
    offset += 8;
    if (offset + size > buffer.length) break;
    const chunk = buffer.slice(offset, offset + size).toString('utf8');
    offset += size;
    if (streamType === 1) stdout += chunk;
    else if (streamType === 2) stderr += chunk;
  }

  return { stdout, stderr };
}

// ── Health check ─────────────────────────────────────────────────────────────
export async function checkDockerHealth(): Promise<boolean> {
  try {
    await docker.ping();
    return true;
  } catch {
    return false;
  }
}
