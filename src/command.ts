import { MODEL_PATH, WHISPER_CLI_PATH } from './constants';
import { WhisperModel } from './model';
import { WhisperCppCommandInput, WhisperCppCommandInputOptions, WhisperOptions } from './types';

import { existsSync } from 'fs';
import { resolve } from 'path';

export class WhisperCommand {
  constructor(readonly options: WhisperOptions) {}

  public build(input: WhisperCppCommandInput): string {
    const model = WhisperModel.find(input.model);

    if (!model) {
      throw new Error(`modelName "${input.model}" not found in list of models. Check your spelling OR use a custom modelPath.`);
    }

    return [WHISPER_CLI_PATH, ...this.createArgs(input.options), '-m', `./models/${model.bin}`, '-f', input.input].join(' ');
  }

  public hasModelDownloaded(name: string) {
    const model = WhisperModel.find(name);

    if (!model) {
      throw new Error(`modelName "${name}" not found in list of models. Check your spelling OR use a custom modelPath.`);
    }

    return existsSync(resolve(MODEL_PATH, model.bin));
  }

  private createArgs(options?: WhisperCppCommandInputOptions): string[] {
    if (!options) {
      return [];
    }

    if (this.options.gpu === false && this.options.gpuDevice !== undefined) {
      throw new Error("Invalid option pair. 'gpuDevice' requires GPU. Remove gpuDevice OR set 'useGpu' to true.");
    }

    if (this.options.gpuDevice !== undefined && (!Number.isInteger(this.options.gpuDevice) || this.options.gpuDevice < 0)) {
      throw new Error("Invalid option. 'gpuDevice' must be a non-negative integer.");
    }

    const args: string[] = [];

    if (options.generateFileText) {
      args.push('-otxt');
    }

    if (options.generateFileSubtitle) {
      args.push('-osrt');
    }

    if (options.generateFileVtt) {
      args.push('-ovtt');
    }

    if (options.timestampSize && options.wordTimestamps) {
      throw new Error("Invalid option pair. Use 'timestampSize' OR 'wordTimestamps'. NOT BOTH!");
    }

    if (options.wordTimestamps) {
      args.push('-ml', '1');
    }

    if (options.timestampSize) {
      args.push('-ml', String(options.timestampSize));
    }

    if (options.language) {
      args.push('-l', options.language);
    }

    if (this.options.gpu === false) {
      args.push('-ng');
    }

    if (this.options.gpuDevice !== undefined) {
      args.push('-dev', String(this.options.gpuDevice));
    }

    if (this.options.flashAttention === true) {
      args.push('-fa');
    }

    if (this.options.flashAttention === false) {
      args.push('-nfa');
    }

    return args;
  }
}
