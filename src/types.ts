export type WhisperCppCommandInput = {
  model: string;
  input: string;
  options?: WhisperCppCommandInputOptions;
};

export type WhisperCppCommandInputOptions = {
  generateFileText?: boolean;
  generateFileSubtitle?: boolean;
  generateFileVtt?: boolean;
  timestampSize?: number;
  wordTimestamps?: boolean;
  language?: string;
};

export type WhisperCommandResult = {
  code: number | null;
  stdout: string;
  stderr: string;
};

export type WhisperShellOptions = {
  debug?: boolean;
};

export type WhisperTranscriptLine = {
  start: string;
  end: string;
  speech: string;
};

export type WhisperModelName = 'tiny' | 'tiny.en' | 'base' | 'base.en' | 'small' | 'small.en' | 'medium' | 'medium.en' | 'large' | 'large-v1';
export type WhisperOptions = {
  model: WhisperModelName;
  gpu?: boolean;
  gpuDevice?: number;
  flashAttention?: boolean;
  debug?: boolean;
  async?: boolean;
};
