import { existsSync } from 'node:fs';
import path from 'node:path';

import { WhisperCommand } from './command';
import { WhisperShell } from './shell';
import { WhisperTranscribeOptions, WhisperTranscriptLine } from './types';

export class Whisper {
  public async transcribe(filePath: string, options: WhisperTranscribeOptions = {}): Promise<WhisperTranscriptLine[]> {
    const resolvedFilePath = this.resolveRequiredFilePath(filePath);
    const resolvedModelPath = options.modelPath ? this.resolveOptionalPath(options.modelPath) : undefined;

    const command = new WhisperCommand().build({
      filePath: this.wrapPath(resolvedFilePath),
      modelName: options.modelName,
      modelPath: resolvedModelPath ? this.wrapPath(resolvedModelPath) : undefined,
      options: options.commandOptions,
    });

    console.log('[@choewy/whisper] Transcribing:', filePath, '\n');

    const transcript = await new WhisperShell().run(command, options.shellOptions);
    return this.toArray(transcript);
  }

  private resolveRequiredFilePath(filePath: string): string {
    const resolved = this.resolveOptionalPath(filePath);

    if (!existsSync(resolved)) {
      throw new Error(`[@choewy/whisper] Input file not found: "${filePath}" (resolved: ${resolved})`);
    }

    return resolved;
  }

  private resolveOptionalPath(value: string): string {
    return path.resolve(process.cwd(), value);
  }

  private wrapPath(value: string): string {
    return `"${path.normalize(value)}"`;
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
