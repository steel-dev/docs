#!/usr/bin/env node
import { run } from './index';
// ABOUTME: CLI entry point — parses flags, prints help or the prompt, or renders a card.
// ABOUTME: Run with: node src/cli.ts --number 35 --motif "…"
import { parseOptions, USAGE } from './options';
import { buildImageSpec } from './prompt';

async function main(argv: string[]): Promise<number> {
  let options;
  try {
    options = parseOptions(argv);
  } catch (error) {
    console.error(`${message(error)}\n\n${USAGE}`);
    return 1;
  }

  if (options.help) {
    console.log(USAGE);
    return 0;
  }

  if (options.printPrompt) {
    if (!options.motif) {
      console.error('--print-prompt needs a --motif');
      return 1;
    }
    const spec = buildImageSpec({ motif: options.motif, colorGrade: options.colorGrade });
    console.log(JSON.stringify(spec, null, 2));
    return 0;
  }

  try {
    await run(options, (line) => console.error(line));
    console.log(options.out);
    return 0;
  } catch (error) {
    console.error(message(error));
    return 1;
  }
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

process.exitCode = await main(process.argv.slice(2));
