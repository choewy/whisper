import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const DEFAULT_MODEL = 'base';

const DEVELOPMENT_MODELS_PATH = 'vendor/whisper.cpp/models';
const PACKAGE_MODELS_PATH = 'node_modules/@choewy/whisper/lib/whisper.cpp/models';
const PACKAGE_MODELS_ABSOLUTE_PATH = resolve(process.cwd(), PACKAGE_MODELS_PATH);

export const NODE_MODULES_MODELS_PATH = process.env.NODE_ENV === 'development' || !existsSync(PACKAGE_MODELS_ABSOLUTE_PATH) ? DEVELOPMENT_MODELS_PATH : PACKAGE_MODELS_PATH;

export const ROOT_PATH = resolve(process.cwd(), NODE_MODULES_MODELS_PATH, '..');
export const MODEL_PATH = resolve(process.cwd(), NODE_MODULES_MODELS_PATH);

export const WHISPER_CLI_PATH = process.platform === 'win32' ? 'build/bin/whisper-cli.exe' : 'build/bin/whisper-cli';
export const WHISPER_CLI_ABSOLUTE_PATH = resolve(ROOT_PATH, WHISPER_CLI_PATH);
