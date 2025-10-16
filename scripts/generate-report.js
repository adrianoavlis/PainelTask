import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { generateReport } from '../assets/js/utils/reportGenerator.js';

function usage() {
  console.error('Usage: node scripts/generate-report.js <input-json> [output-markdown]');
}

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);

  if (!inputPath) {
    usage();
    process.exitCode = 1;
    return;
  }

  const jsonPath = path.resolve(process.cwd(), inputPath);
  const rawContent = await readFile(jsonPath, 'utf8');
  let data;

  try {
    data = JSON.parse(rawContent);
  } catch (error) {
    console.error('Failed to parse JSON input:', error);
    process.exitCode = 1;
    return;
  }

  const { markdown } = generateReport(data);

  if (outputPath) {
    const resolvedOutput = path.resolve(process.cwd(), outputPath);
    await mkdir(path.dirname(resolvedOutput), { recursive: true });
    await writeFile(resolvedOutput, markdown, 'utf8');
  } else {
    process.stdout.write(markdown);
  }
}

main().catch((error) => {
  console.error('Failed to generate report:', error);
  process.exitCode = 1;
});
