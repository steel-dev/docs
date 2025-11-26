import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';
import { formatCodeBlock } from './format-code';

export function remarkFormatCode() {
  return (tree: Root) => {
    // Format code blocks synchronously during visit
    visit(tree, 'code', (node) => {
      if (node.lang && shouldFormatLanguage(node.lang)) {
        try {
          node.value = formatCodeBlockSync(node.value, node.lang);
        } catch (error) {
          console.warn(`Failed to format code block with language "${node.lang}":`, error);
          // Keep original code if formatting fails
        }
      }
    });
  };
}

function formatCodeBlockSync(code: string, language: string): string {
  // Basic synchronous formatting - just cleanup whitespace and indentation
  switch (language?.toLowerCase()) {
    case 'javascript':
    case 'js':
    case 'typescript':
    case 'ts':
    case 'python':
    case 'py':
    case 'json':
      return cleanupCode(code);
    default:
      return code;
  }
}

function cleanupCode(code: string): string {
  return code
    .split('\n')
    .map((line) => line.trimEnd()) // Remove trailing whitespace
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive empty lines
    .trim(); // Remove leading/trailing empty lines
}

function shouldFormatLanguage(lang: string): boolean {
  const supportedLanguages = [
    'javascript',
    'js',
    'typescript',
    'ts',
    'python',
    'py',
    'json',
    // Add more languages as needed
  ];

  return supportedLanguages.includes(lang.toLowerCase());
}
