import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

import { ROOT_PATH, WHISPER_CLI_ABSOLUTE_PATH } from './constants';
import { WhisperCommandResult, WhisperShellOptions } from './types';

const DEFAULT_SHELL_OPTIONS: Required<WhisperShellOptions> = {
  debug: false,
  async: false,
};

export class WhisperShell {
  private isReady = false;

  public async run(command: string, options: WhisperShellOptions = DEFAULT_SHELL_OPTIONS): Promise<string> {
    const resolvedOptions = this.resolveOptions(options);

    await this.ensureMainBinary(resolvedOptions);

    const result = await this.execute(command, ROOT_PATH, resolvedOptions);

    if (result.code === 0) {
      return result.stdout;
    }

    throw new Error(result.stderr.trim() || `[@choewy/whisper] Command failed: ${command} (exit code: ${result.code})`);
  }

  private resolveOptions(options: WhisperShellOptions): Required<WhisperShellOptions> {
    return { ...DEFAULT_SHELL_OPTIONS, ...options };
  }

  private async ensureMainBinary(options: Required<WhisperShellOptions>): Promise<void> {
    if (this.isReady) {
      return;
    }

    if (existsSync(WHISPER_CLI_ABSOLUTE_PATH)) {
      this.isReady = true;
      return;
    }

    console.log(`[@choewy/whisper] Problem. whisper.cpp not initialized. Root path: ${ROOT_PATH}`);
    console.log("[@choewy/whisper] Attempting to run 'make' command in whisper.cpp root...");

    const buildResult = await this.execute('make', ROOT_PATH, options);

    if (buildResult.code !== 0) {
      throw new Error(`[@choewy/whisper] 'make' command failed. Please run 'make' manually in whisper.cpp root and try again.\n${buildResult.stderr}`);
    }

    if (!existsSync(WHISPER_CLI_ABSOLUTE_PATH)) {
      throw new Error(`[@choewy/whisper] Build finished but CLI binary was not found: ${WHISPER_CLI_ABSOLUTE_PATH}. Please check whisper.cpp build output.`);
    }

    console.log(`[@choewy/whisper] 'make' command successful. Root path: ${ROOT_PATH}`);
    this.isReady = true;
  }

  private async execute(command: string, cwd: string, options: Required<WhisperShellOptions>): Promise<WhisperCommandResult> {
    return new Promise<WhisperCommandResult>((resolvePromise, rejectPromise) => {
      const child = spawn(command, {
        cwd,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (chunk: Buffer | string) => {
        const text = chunk.toString();
        stdout += text;

        if (options.debug) {
          process.stdout.write(text);
        }
      });

      child.stderr?.on('data', (chunk: Buffer | string) => {
        const text = chunk.toString();
        stderr += text;

        if (options.debug) {
          process.stderr.write(text);
        }
      });

      child.on('error', (error) => {
        rejectPromise(error);
      });

      child.on('close', (code) => {
        resolvePromise({ code, stdout, stderr });
      });
    });
  }
}
