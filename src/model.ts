import { WhisperModelName } from './types';

export class WhisperModel {
  static TINY = new WhisperModel('tiny', 75, 'MB', 390, 'MB');
  static TINY_EN = new WhisperModel('tiny.en', 75, 'MB', 390, 'MB');
  static BASE = new WhisperModel('base', 142, 'MB', 500, 'MB');
  static BASE_EN = new WhisperModel('base.en', 142, 'MB', 500, 'MB');
  static SMALL = new WhisperModel('small', 466, 'MB', 1.0, 'GB');
  static SMALL_EN = new WhisperModel('small.en', 466, 'MB', 1.0, 'GB');
  static MEDIUM = new WhisperModel('medium', 1.5, 'GB', 2.6, 'GB');
  static MEDIUM_EN = new WhisperModel('medium.en', 1.5, 'GB', 2.6, 'GB');
  static LARGE = new WhisperModel('large', 2.9, 'GB', 4.7, 'GB');
  static LARGE_V1 = new WhisperModel('large-v1', 2.9, 'GB', 4.7, 'GB');

  constructor(
    readonly name: WhisperModelName,
    readonly diskSize: number,
    readonly diskUnit: 'KB' | 'MB' | 'GB',
    readonly memorySize: number,
    readonly memoryUnit: 'KB' | 'MB' | 'GB',
  ) {}

  get disk(): string {
    return [this.diskSize, this.diskUnit].join(' ');
  }

  get memory(): string {
    let size: string;

    switch (true) {
      case this.memoryUnit === 'GB':
        size = this.memorySize.toFixed(1);

        break;

      default:
        if (Number.isInteger(this.memorySize)) {
          size = this.memorySize.toString();
        } else {
          size = this.memorySize.toFixed(1);
        }

        break;
    }

    return ['~', size, this.memoryUnit].join(' ');
  }

  get bin(): string {
    return `ggml-${this.name}.bin`;
  }

  static models(): WhisperModel[] {
    const descriptors = Object.getOwnPropertyDescriptors(this);
    const values = Object.values(descriptors);
    const models: WhisperModel[] = [];

    for (const descriptor of values) {
      const value = descriptor.value as unknown;

      if (value instanceof this) {
        models.push(value);
      }
    }

    return models;
  }

  static has(name: string): boolean {
    return !!this.models().find((model) => model.name === name);
  }

  static find(name: string): WhisperModel | null {
    return this.models().find((model) => model.name === name) ?? null;
  }

  static print(): void {
    const models = this.models();

    if (models.length === 0) {
      console.log('[@choewy/whisper] No models registered.');
      return;
    }

    const width = {
      model: Math.max('Model'.length, ...models.map((model) => model.name.length)) + 2,
      disk: Math.max('Disk'.length, ...models.map((model) => model.disk.length)) + 2,
      memory: Math.max('RAM'.length, ...models.map((model) => model.memory.length)) + 2,
    };

    const header = [' Model'.padEnd(width.model), ' Disk'.padEnd(width.disk), ' RAM'.padEnd(width.memory)].join('|');
    const divider = ['-'.repeat(width.model), '-'.repeat(width.disk), '-'.repeat(width.memory)].join('|');
    const rows = [`|${header}|`, `|${divider}|`];

    for (const model of models) {
      const row = [` ${model.name}`.padEnd(width.model), `${model.disk} `.padStart(width.disk), `${model.memory} `.padStart(width.memory)].join('|');

      rows.push(`|${row}|`);
    }

    console.log(rows.join('\n'));
  }
}
