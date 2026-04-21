import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { DEFAULT_MODEL, MODEL_PATH, WHISPER_CLI_PATH } from './constants';
import { WhisperModel } from './model';
import { WhisperCppCommandInput, WhisperCppCommandInputOptions } from './types';

const DOWNLOAD_HINT = "Run 'npx @choewy/whisper download'";
const MODELS_DIR = './models';

export class WhisperCommand {
  public build(input: WhisperCppCommandInput): string {
    const modelPath = this.resolveModelPath(input.modelName, input.modelPath);
    const args = this.createArgs(input.options);
    const parts = [WHISPER_CLI_PATH, ...args, '-m', modelPath, '-f', input.filePath];

    return parts.join(' ');
  }

  private resolveModelPath(modelName?: string | null, modelPath?: string | null): string {
    const name = modelName ?? undefined;
    const path = modelPath ?? undefined;

    if (name && path) {
      throw new Error('Submit a modelName OR a modelPath. NOT BOTH!');
    }

    if (path) {
      return path;
    }

    if (!name) {
      console.log(`[@choewy/whisper] No 'modelName' or 'modelPath' provided. Trying default model: ${DEFAULT_MODEL}\n`);
      return this.resolveInstalledModelPath(DEFAULT_MODEL, true);
    }

    return this.resolveInstalledModelPath(name, false);
  }

  private resolveInstalledModelPath(modelName: string, isDefault: boolean): string {
    const model = WhisperModel.find(modelName);

    if (!model) {
      throw new Error(`modelName "${modelName}" not found in list of models. Check your spelling OR use a custom modelPath.`);
    }

    const resolvedModelPath = `${MODELS_DIR}/${model.bin}`;
    const absoluteModelPath = resolve(MODEL_PATH, model.bin);

    if (!existsSync(absoluteModelPath)) {
      const target = isDefault ? DEFAULT_MODEL : modelName;
      throw new Error(`'${target}' not downloaded! ${DOWNLOAD_HINT}`);
    }

    return resolvedModelPath;
  }

  private createArgs(options?: WhisperCppCommandInputOptions): string[] {
    if (!options) {
      return [];
    }

    this.validateRuntimeOptions(options);

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

    if (options.useGpu === false) {
      args.push('-ng');
    }

    if (options.gpuDevice !== undefined) {
      args.push('-dev', String(options.gpuDevice));
    }

    if (options.flashAttention === true) {
      args.push('-fa');
    }

    if (options.flashAttention === false) {
      args.push('-nfa');
    }

    return args;
  }

  private validateRuntimeOptions(options: WhisperCppCommandInputOptions): void {
    if (options.useGpu === false && options.gpuDevice !== undefined) {
      throw new Error("Invalid option pair. 'gpuDevice' requires GPU. Remove gpuDevice OR set 'useGpu' to true.");
    }

    if (options.gpuDevice !== undefined && (!Number.isInteger(options.gpuDevice) || options.gpuDevice < 0)) {
      throw new Error("Invalid option. 'gpuDevice' must be a non-negative integer.");
    }
  }
}
