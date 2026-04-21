import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface, Interface } from 'node:readline/promises';

import { DEFAULT_MODEL, MODEL_PATH, ROOT_PATH } from './constants';
import { WhisperModel } from './model';

export class WhisperModelDownloader {
  public async run(name: string) {
    this.ensureDownloadScriptExists();

    if (!name) {
      return;
    }

    await this.downloadModel(name);
    console.log('[@choewy/whisper] Attempting to compile model...');
    await this.execute('make', [], ROOT_PATH);
  }

  public async runWithPrompt(): Promise<unknown> {
    const prompt: Interface = createInterface({ input, output });

    try {
      WhisperModel.print();
      this.ensureDownloadScriptExists();

      const name = await this.ask(prompt);

      if (!name) {
        return;
      }

      await this.downloadModel(name);
      console.log('[@choewy/whisper] Attempting to compile model...');
      await this.execute('make', [], ROOT_PATH);
    } finally {
      prompt.close();
    }
  }

  private ensureDownloadScriptExists() {
    if (!existsSync(MODEL_PATH)) {
      throw new Error(`[@choewy/whisper] model path not found in package: ${MODEL_PATH}. Verify @choewy/whisper installation contents.`);
    }

    if (!existsSync(ROOT_PATH)) {
      throw new Error(`[@choewy/whisper] whisper.cpp root path not found in package: ${ROOT_PATH}. Verify @choewy/whisper installation contents.`);
    }

    const scriptName = process.platform === 'win32' ? 'download-ggml-model.cmd' : 'download-ggml-model.sh';
    const scriptPath = resolve(MODEL_PATH, scriptName);

    if (!existsSync(scriptPath)) {
      throw new Error(`[@choewy/whisper] model download script not found: ${scriptPath}. Current model path: ${MODEL_PATH}`);
    }
  }

  private async ask(prompt: Interface) {
    while (true) {
      const answer = (await prompt.question(`\n[@choewy/whisper] Enter model name (e.g. 'base.en') or 'cancel' to exit\n(ENTER for base.en): `)).trim();

      if (answer === 'cancel') {
        console.log("[@choewy/whisper] Exiting model downloader. Run again with: 'npx @choewy/whisper download'");
        return null;
      }

      if (answer === '') {
        console.log('[@choewy/whisper] Going with', DEFAULT_MODEL);
        return DEFAULT_MODEL;
      }

      if (WhisperModel.has(answer)) {
        return answer;
      }

      console.log('\n[@choewy/whisper] FAIL: Name not found. Check your spelling OR quit wizard and use custom model.');
    }
  }

  private async downloadModel(name: string) {
    const scriptName = process.platform === 'win32' ? 'download-ggml-model.cmd' : 'download-ggml-model.sh';
    const scriptPath = resolve(MODEL_PATH, scriptName);

    if (process.platform === 'win32') {
      await this.execute('cmd.exe', ['/c', scriptPath, name], MODEL_PATH);
    } else {
      // Run through `sh` so npm-packed files do not require executable mode bits.
      await this.execute('sh', [scriptPath, name], MODEL_PATH);
    }
  }

  private async execute(command: string, args: string[], cwd: string) {
    await new Promise<void>((resolvePromise, rejectPromise) => {
      const child = spawn(command, args, { cwd, stdio: 'inherit' });

      child.on('error', (error) => {
        const code = (error as NodeJS.ErrnoException).code;

        if (code === 'ENOENT') {
          rejectPromise(new Error(`[@choewy/whisper] Command not found: ${command}. Ensure required tools are installed and available in PATH. (cwd: ${cwd})`));
          return;
        }

        if (code === 'EACCES') {
          rejectPromise(new Error(`[@choewy/whisper] Permission denied while running command: ${command} ${args.join(' ')}. Check filesystem permissions under ${cwd}.`));
          return;
        }

        rejectPromise(error);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolvePromise();
          return;
        }

        rejectPromise(new Error(`[@choewy/whisper] Command failed: ${command} ${args.join(' ')} (exit code: ${code})`));
      });
    });
  }
}
