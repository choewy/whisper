import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface, Interface } from 'node:readline/promises';

import { DEFAULT_MODEL, MODEL_PATH, ROOT_PATH } from './constants';
import { WhisperModel } from './model';

export class WhisperModelDownloader {
  public async run(name: string) {
    try {
      this.ensureDownloadScriptExists();

      if (!name) {
        return;
      }

      await this.downloadModel(name);
      console.log('[@choewy/whisper] Attempting to compile model...');
      await this.execute('make', [], ROOT_PATH);
    } catch (error) {
      console.log('ERROR Caught in downloadModel');
      console.log(error);
      return error;
    }
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
    } catch (error) {
      console.log('ERROR Caught in downloadModel');
      console.log(error);
      return error;
    } finally {
      prompt.close();
    }
  }

  private ensureDownloadScriptExists() {
    const scriptName = process.platform === 'win32' ? 'download-ggml-model.cmd' : 'download-ggml-model.sh';
    const scriptPath = resolve(MODEL_PATH, scriptName);

    if (!existsSync(scriptPath)) {
      throw new Error('@choewy/whisper downloader is not being run from the correct path! cd to project root and run again.');
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
    if (process.platform === 'win32') {
      await this.execute('cmd.exe', ['/c', 'download-ggml-model.cmd', name], MODEL_PATH);
    } else {
      await this.execute('./download-ggml-model.sh', [name], MODEL_PATH);
    }
  }

  private async execute(command: string, args: string[], cwd: string) {
    await new Promise<void>((resolvePromise, rejectPromise) => {
      const child = spawn(command, args, { cwd, stdio: 'inherit' });

      child.on('error', (error) => {
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
