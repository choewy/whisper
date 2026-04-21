export type WhisperCppCommandInput = {
  filePath: string;
  modelName?: string | null;
  modelPath?: string | null;
  options?: WhisperCppCommandInputOptions;
};

export type WhisperCppCommandInputOptions = {
  generateFileText?: boolean;
  generateFileSubtitle?: boolean;
  generateFileVtt?: boolean;
  timestampSize?: number;
  wordTimestamps?: boolean;
  language?: string;
  useGpu?: boolean;
  gpuDevice?: number;
  flashAttention?: boolean;
};

export type WhisperCommandResult = {
  code: number | null;
  stdout: string;
  stderr: string;
};

export type WhisperShellOptions = {
  debug?: boolean;
  async?: boolean;
};

export type WhisperTranscribeOptions = {
  modelName?: string;
  modelPath?: string;
  commandOptions?: WhisperCppCommandInputOptions;
  shellOptions?: WhisperShellOptions;
};

export type WhisperTranscriptLine = {
  start: string;
  end: string;
  speech: string;
};
