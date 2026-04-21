import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { MODEL_PATH, ROOT_PATH, WHISPER_CLI_ABSOLUTE_PATH } from './constants';
import { WhisperCommandResult, WhisperShellCommand, WhisperShellOptions } from './types';

const DEFAULT_SHELL_OPTIONS: Required<WhisperShellOptions> = {
  debug: false,
};

export class WhisperShell {
  private isReady = false;

  constructor(readonly options: WhisperShellOptions) {}

  public async run(command: WhisperShellCommand): Promise<string> {
    const options = { ...DEFAULT_SHELL_OPTIONS, ...this.options };

    await this.ensure(options);
    const result = await this.execute(command, ROOT_PATH, options);

    if (result.code === 0) {
      return result.stdout;
    }

    throw new Error(result.stderr.trim() || `[@choewy/whisper] Command failed: ${command.command} (exit code: ${result.code})`);
  }

  private async ensure(options: Required<WhisperShellOptions>): Promise<void> {
    if (this.isReady) {
      return;
    }

    if (!existsSync(ROOT_PATH)) {
      throw new Error(`[@choewy/whisper] whisper.cpp root path not found in package: ${ROOT_PATH}. Verify @choewy/whisper installation contents.`);
    }

    if (!existsSync(MODEL_PATH)) {
      throw new Error(`[@choewy/whisper] model path not found in package: ${MODEL_PATH}. Verify @choewy/whisper installation contents.`);
    }

    if (existsSync(WHISPER_CLI_ABSOLUTE_PATH)) {
      this.isReady = true;
      return;
    }

    console.log(`[@choewy/whisper] Problem. whisper.cpp not initialized. Root path: ${ROOT_PATH}`);
    console.log("[@choewy/whisper] Attempting to run 'make' command in whisper.cpp root...");

    const buildResult = await this.execute({ command: 'make', args: [] }, ROOT_PATH, options);

    if (buildResult.code !== 0) {
      throw new Error(`[@choewy/whisper] 'make' command failed. Please run 'make' manually in whisper.cpp root and try again.\n${buildResult.stderr}`);
    }

    if (!existsSync(WHISPER_CLI_ABSOLUTE_PATH)) {
      throw new Error(`[@choewy/whisper] Build finished but CLI binary was not found: ${WHISPER_CLI_ABSOLUTE_PATH}. Please check whisper.cpp build output.`);
    }

    console.log(`[@choewy/whisper] 'make' command successful. Root path: ${ROOT_PATH}`);

    this.isReady = true;
  }

  private async execute(command: string | WhisperShellCommand, cwd: string, options: Required<WhisperShellOptions>): Promise<WhisperCommandResult> {
    return new Promise<WhisperCommandResult>((resolvePromise, rejectPromise) => {
      const child =
        typeof command === 'string'
          ? spawn(command, {
              cwd,
              shell: true,
              stdio: ['ignore', 'pipe', 'pipe'],
            })
          : spawn(command.command, command.args, {
              cwd,
              shell: false,
              stdio: ['ignore', 'pipe', 'pipe'],
            });

      const commandText = typeof command === 'string' ? command : [command.command, ...command.args].join(' ');

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
        const errorCode = (error as NodeJS.ErrnoException).code;

        if (errorCode === 'ENOENT') {
          rejectPromise(new Error(`[@choewy/whisper] Command not found: ${commandText}. Ensure required tools are installed and available in PATH. (cwd: ${resolve(cwd)})`));
          return;
        }

        rejectPromise(error);
      });

      child.on('close', (code) => {
        resolvePromise({ code, stdout, stderr });
      });
    });
  }
}
