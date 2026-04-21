import { resolve } from 'node:path';

export const DEFAULT_MODEL = 'base';

export const PACKAGE_ROOT = resolve(__dirname, '..');

export const ROOT_PATH = resolve(PACKAGE_ROOT, 'vendor/whisper.cpp');
export const MODEL_PATH = resolve(ROOT_PATH, 'models');
export const NODE_MODULES_MODELS_PATH = MODEL_PATH;

export const WHISPER_CLI_PATH = process.platform === 'win32' ? 'build/bin/whisper-cli.exe' : 'build/bin/whisper-cli';
export const WHISPER_CLI_ABSOLUTE_PATH = resolve(ROOT_PATH, WHISPER_CLI_PATH);
