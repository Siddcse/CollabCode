import type { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@collabcode/shared';
import type { ExecutionRequest } from '@collabcode/shared';
import { runCode, runCommand, checkDockerHealth } from '../services/docker.service';
import { ExecutionLog } from '../models/ExecutionLog';
import { isDBConnected } from '../config/db';

export function registerExecutionHandlers(io: Server, socket: Socket): void {
  socket.on(SOCKET_EVENTS.RUN_CODE, async (request: ExecutionRequest) => {
    try {
      const user = socket.user;
      if (!user?.roomCode) return;

      const dockerAvailable = await checkDockerHealth();
      const mode = dockerAvailable ? '🐳 Docker' : '⚡ Local';
      console.log(`[Execution] ${mode} mode — lang: ${request.language}`);

      // runCode() internally tries Docker first, falls back to local process
      const result = await runCode(request.language, request.code);

      // Append mode note to output if local fallback was used
      const finalResult = dockerAvailable
        ? result
        : {
            ...result,
            output: result.output
              ? `[Running locally — Docker not active]\n\n${result.output}`
              : result.output,
            error: result.error && !result.output
              ? result.error
              : result.error,
          };

      // Save to DB (non-blocking)
      if (isDBConnected()) {
        ExecutionLog.create({
          roomId: user.roomId,
          language: request.language,
          code: request.code,
          ...finalResult,
        }).catch(() => {});
      }

      io.to(user.roomCode).emit(SOCKET_EVENTS.EXECUTION_RESULT, finalResult);
    } catch (err) {
      console.error('run-code error:', err);
      socket.emit(SOCKET_EVENTS.EXECUTION_RESULT, {
        output: '',
        error: 'Execution failed. Please try again.',
        exitCode: -1,
        executionTimeMs: 0,
        memoryUsageMb: 0,
      });
    }
  });

  socket.on(SOCKET_EVENTS.RUN_COMMAND, async (data: { command: string }) => {
    try {
      const user = socket.user;
      if (!user?.roomCode) return;

      console.log(`[Terminal] Running command: ${data.command}`);
      const result = await runCommand(data.command);

      socket.emit(SOCKET_EVENTS.COMMAND_RESULT, result);
    } catch (err) {
      console.error('run-command error:', err);
      socket.emit(SOCKET_EVENTS.COMMAND_RESULT, {
        output: '',
        error: 'Command execution failed.',
        exitCode: -1,
      });
    }
  });
}
