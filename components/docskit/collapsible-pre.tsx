'use client';

import { Pre } from 'codehike/code';
import React from 'react';
// Collapsible wrapper for Pre component
export function CollapsiblePre({
  code,
  ...props
}: React.ComponentProps<typeof Pre> & { code: any }) {
  const [expanded, setExpanded] = React.useState(false);

  // code.code is the raw code string, code.lines is the highlighted lines array
  const codeString = code.code || '';
  const codeLines = codeString.split('\n');
  const isCollapsible = codeLines.length > 10;

  // If highlighted lines are available, slice those for proper highlighting

  const visibleLines = expanded || !isCollapsible ? codeLines : codeLines.slice(0, 10);

  console.log(visibleLines.length);

  // Show only the first 30 lines unless expanded
  const displayCode = {
    ...code,
    lines: visibleLines,
    code: expanded || !isCollapsible ? codeString : codeLines.slice(0, 10).join('\n'),
  };

  return (
    <div>
      <Pre {...props} code={displayCode} />
      {isCollapsible && (
        <div className="mt-2">
          <button
            type="button"
            className="text-xs text-blue-500 underline"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Show less' : `Show ${codeLines.length - 10} more lines`}
          </button>
        </div>
      )}
    </div>
  );
}
