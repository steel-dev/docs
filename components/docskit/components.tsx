import { Block, CodeBlock } from 'codehike/blocks';
import type { RawCode } from 'codehike/code';
import Link from 'fumadocs-core/link';
import { z } from 'zod';
import { Code } from './code';
import { SimpleCode } from './code-simple';
import { InlineCode } from './inline-code';
import { WithNotes } from './notes';
import { NoteTooltip } from './notes.tooltip';
import ScrollyCoding from './scrollycoding';
import Slideshow from './slideshow';
import Spotlight from './spotlight';
import { Terminal } from './terminal';

// Export RawCode type for external use
export type { RawCode };

// Export PackageInstall for external use
export { PackageInstall };

export const docskit = {
  // components that code hike will use for codeblocks and inline code
  // as defined in the code hike config:
  DocsKitCode,
  DocsKitInlineCode: InlineCode,
  // extra components that can be used from mdx:
  WithNotes,
  CodeTabs,
  TerminalPicker,
  // overriding the link component so we can use it for tooltips
  a: DocsKitLink,
  ScrollyCoding,
  Spotlight,
  Slideshow,
  SimpleCode,
};

function DocsKitCode(props: { codeblock: RawCode }) {
  const { codeblock, ...rest } = props;

  if (codeblock.lang === 'package-install') {
    return <PackageInstall codeblock={codeblock} />;
  }

  if (codeblock.lang === 'terminal') {
    // Parse flags from meta string (e.g., "terminal -o" -> hideOutput: true)
    const hideOutput = codeblock.meta?.includes('-o') || false;
    return <Terminal codeblocks={[codeblock]} hideOutput={hideOutput} />;
  }

  return <Code {...rest} codeblocks={[codeblock]} />;
}

function CodeTabs(props: unknown) {
  //@ts-ignore
  const { data, error } = Block.extend({
    code: z.array(CodeBlock),
    flags: z.string().optional(),
    storage: z.string().optional(),
  }).safeParse(props);

  if (error) {
    throw betterError(error, 'CodeTabs');
  }

  const { code, flags, storage } = data;

  return <Code codeblocks={code} flags={flags} storage={storage} />;
}

function betterError(error: z.ZodError, componentName: string) {
  const { issues } = error;
  if (issues.length === 1 && issues[0].path[0] === 'code') {
    return new Error(`<${componentName}> should contain at least one codeblock marked with \`!!\``);
  } else {
    return error;
  }
}

function DocsKitLink(props: any) {
  if (props.href === 'tooltip') {
    return <NoteTooltip name={props.title}>{props.children}</NoteTooltip>;
  }
  return <Link {...props} />;
}

function PackageInstall({ codeblock }: { codeblock: RawCode }) {
  const meta = (codeblock.meta ?? '').toLowerCase();

  const isPython = meta.includes('python') || meta.split(/\s+/).includes('py');
  const noVenv = meta.split(/\s+/).includes('-no-venv');

  const isJS =
    meta.includes('javascript') ||
    meta.includes('typescript') ||
    meta.split(/\s+/).includes('js') ||
    meta.split(/\s+/).includes('ts') ||
    (!isPython && true);

  const jsBlocks = [
    {
      ...codeblock,
      value: '$ npm install ' + codeblock.value,
      meta: 'npm',
      lang: 'terminal',
    },
    {
      ...codeblock,
      value: '$ yarn add ' + codeblock.value,
      meta: 'yarn',
      lang: 'terminal',
    },
    {
      ...codeblock,
      value: '$ pnpm add ' + codeblock.value,
      meta: 'pnpm',
      lang: 'terminal',
    },
    {
      ...codeblock,
      value: '$ bun add ' + codeblock.value,
      meta: 'bun',
      lang: 'terminal',
    },
  ];

  const pythonBlocks = noVenv
    ? [
        {
          ...codeblock,
          value: '$ uv add ' + codeblock.value,
          meta: 'uv',
          lang: 'terminal',
        },
        {
          ...codeblock,
          value: '$ poetry add ' + codeblock.value,
          meta: 'poetry',
          lang: 'terminal',
        },
        {
          ...codeblock,
          value: '$ pip install ' + codeblock.value,
          meta: 'pip',
          lang: 'terminal',
        },
      ]
    : [
        {
          ...codeblock,
          value: `$ uv venv\n` + `$ source .venv/bin/activate\n` + `$ uv add ${codeblock.value}`,
          meta: 'uv',
          lang: 'terminal',
        },
        {
          ...codeblock,
          value: `$ poetry shell\n` + `$ poetry add ${codeblock.value}`,
          meta: 'poetry',
          lang: 'terminal',
        },
        {
          ...codeblock,
          value:
            `$ python -m venv .venv\n` +
            `$ source .venv/bin/activate\n` +
            `$ pip install ${codeblock.value}`,
          meta: 'pip',
          lang: 'terminal',
        },
      ];

  return <Terminal storage="package-install" codeblocks={isPython ? pythonBlocks : jsBlocks} />;
}

function TerminalPicker(props: unknown) {
  //@ts-ignore
  const { data, error } = Block.extend({
    code: z.array(CodeBlock),
    storage: z.string().optional(),
    flags: z.string().optional(),
  }).safeParse(props);

  if (error) {
    throw betterError(error, 'TerminalPicker');
  }

  const { code, storage, flags } = data;
  const hideOutput = flags?.includes('-o') || false;
  return <Terminal codeblocks={code} storage={storage} hideOutput={hideOutput} />;
}
