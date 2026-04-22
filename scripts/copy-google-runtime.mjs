import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const sourceDir = join(process.cwd(), 'src', 'google', 'api');
const targetDir = join(process.cwd(), 'dist', 'google', 'api');

if (!existsSync(sourceDir)) {
    throw new Error(`Missing source runtime directory: ${sourceDir}`);
}

mkdirSync(targetDir, { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true });