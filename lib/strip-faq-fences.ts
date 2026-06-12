// ABOUTME: Removes :::faq directive fences from raw MDX so LLM-served markdown
// ABOUTME: exposes clean "### Question / answer" sections without directive syntax.

export function stripFaqFences(content: string): string {
  const lines = content.split('\n');
  const out: string[] = [];
  let depth = 0; // directive nesting depth inside a :::faq block

  for (const line of lines) {
    const trimmed = line.trim();

    if (depth === 0) {
      if (trimmed === ':::faq') {
        depth = 1;
        continue; // drop the opening fence
      }
      out.push(line);
      continue;
    }

    // inside a :::faq block: keep nested directives intact, drop only faq's own fences
    if (trimmed.startsWith(':::') && trimmed.length > 3) {
      depth++;
      out.push(line);
      continue;
    }
    if (trimmed === ':::') {
      depth--;
      if (depth === 0) continue; // drop the faq closing fence
      out.push(line);
      continue;
    }
    out.push(line);
  }

  return out.join('\n');
}
