import prettier from 'prettier';

export async function formatCodeBlock(code: string, language: string): Promise<string> {
  try {
    switch (language?.toLowerCase()) {
      case 'javascript':
      case 'js':
        return await prettier.format(code, {
          parser: 'babel',
          semi: true,
          singleQuote: true,
          tabWidth: 2,
          trailingComma: 'es5',
          printWidth: 80,
          bracketSpacing: true,
          arrowParens: 'avoid',
        });

      case 'typescript':
      case 'ts':
        return await prettier.format(code, {
          parser: 'typescript',
          semi: true,
          singleQuote: true,
          tabWidth: 2,
          trailingComma: 'es5',
          printWidth: 80,
          bracketSpacing: true,
          arrowParens: 'avoid',
        });

      case 'python':
      case 'py':
        // For Python, provide basic cleanup since integrating Black would be complex
        return cleanupPython(code);

      case 'json':
        return await prettier.format(code, {
          parser: 'json',
          tabWidth: 2,
          printWidth: 80,
        });

      default:
        // For unsupported languages, just clean up whitespace
        return cleanupGeneric(code);
    }
  } catch (error) {
    console.warn(`Failed to format ${language} code block:`, error);
    return code; // Return original code if formatting fails
  }
}

function cleanupPython(code: string): string {
  return code
    .split('\n')
    .map((line) => line.trimEnd()) // Remove trailing whitespace
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive empty lines
    .trim(); // Remove leading/trailing empty lines
}

function cleanupGeneric(code: string): string {
  return code
    .split('\n')
    .map((line) => line.trimEnd()) // Remove trailing whitespace
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive empty lines
    .trim(); // Remove leading/trailing empty lines
}
