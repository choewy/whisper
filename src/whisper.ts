import { existsSync } from 'fs';
import path, { resolve } from 'path';

import { WhisperCommand } from './command';
import { MODEL_PATH } from './constants';
import { WhisperModelDownloader } from './downloader';
import { WhisperModel } from './model';
import { WhisperShell } from './shell';
import { WhisperCppCommandInputOptions, WhisperOptions, WhisperTranscriptLine } from './types';

export class Whisper {
  private readonly command: WhisperCommand;
  private readonly shell: WhisperShell;

  constructor(
    readonly options: WhisperOptions = {
      model: 'base',
      gpu: false,
      gpuDevice: 0,
      flashAttention: false,
      debug: true,
      async: true,
    },
  ) {
    this.command = new WhisperCommand(options);
    this.shell = new WhisperShell({ debug: options.debug });
  }

  async initialize(): Promise<Whisper> {
    const model = WhisperModel.find(this.options.model);

    if (!model) {
      throw new Error(`modelName "${this.options.model}" not found in list of models. Check your spelling OR use a custom modelPath.`);
    }

    if (!existsSync(resolve(MODEL_PATH, model.bin))) {
      const downloader = new WhisperModelDownloader();
      await downloader.run(model.name);
    }

    return this;
  }

  async transcribe(input: string, options: WhisperCppCommandInputOptions = {}): Promise<WhisperTranscriptLine[]> {
    const resolvedPath = path.resolve(process.cwd(), input);

    if (!existsSync(resolvedPath)) {
      throw new Error(`[@choewy/whisper] Input file not found: "${resolvedPath}" (resolved: ${resolvedPath})`);
    }

    const command = this.command.build({
      model: this.options.model,
      input: `"${path.normalize(resolvedPath)}"`,
      options,
    });

    console.log('[@choewy/whisper] Transcribing:', input, '\n');

    return this.toArray(await this.shell.run(command));
  }

  private toArray(transcript: string): WhisperTranscriptLine[] {
    const lines: string[] = transcript.match(/\[[0-9:.]+\s-->\s[0-9:.]+\].*/g) ?? [];

    lines.shift();

    return lines.map((line) => {
      const [timestamp, speech] = line.split(']  ');
      const [start, end] = timestamp.substring(1).split(' --> ');

      return {
        start,
        end,
        speech: speech.replace(/\n/g, '').replace(' ', ''),
      };
    });
  }
}
