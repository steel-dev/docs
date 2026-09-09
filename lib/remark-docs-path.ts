import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';
import { docsPath } from './docs-path';

/** Rewrite rendered links/media, never prose or code examples in the source. */
export function remarkDocsPath() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (node.type === 'link' || node.type === 'image' || node.type === 'definition') {
        node.url = docsPath(node.url);
      }
      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
        for (const attribute of node.attributes) {
          if (
            attribute.type === 'mdxJsxAttribute' &&
            ['href', 'src', 'poster'].includes(attribute.name) &&
            typeof attribute.value === 'string'
          )
            attribute.value = docsPath(attribute.value);
        }
      }
    });
  };
}
