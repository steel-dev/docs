"use client";

import { Pre } from "codehike/code";
import React from "react";
import { cn } from "@/lib/utils";

// Collapsible wrapper for Pre component
export function CollapsiblePre({
  code,
  title,
  preClassName,
  ...props
}: React.ComponentProps<typeof Pre> & {
  code: any;
  title?: string;
  preClassName?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

  // code.code is the raw code string
  const codeString = code.code || "";
  const codeLines = codeString.split("\n");
  const isCollapsible = codeLines.length > 30;

  // const displayCode = expanded
  //   ? code
  //   : {
  //       ...code,
  //       tokens: code.tokens.slice(0, 90),
  //     };

  if (!isCollapsible) {
    return (
      <Pre
        {...props}
        className={cn(
          !title && "!m-0",
          "overflow-x-auto p-3 rounded-lg font-mono bg-[var(--ch-18)] max-w-full",
          preClassName,
        )}
        code={code}
      />
    );
  }

  return (
    <>
      {/* Code block container - separate from button */}
      <div className="relative">
        <div className={!expanded ? "max-h-96 overflow-auto" : ""}>
          <Pre
            {...props}
            // code={displayCode}
            code={code}
            className={cn(
              !title && "!m-0",
              "overflow-x-auto p-3 rounded-lg font-mono bg-[var(--ch-18)] max-w-full",
              preClassName,
            )}
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowWrap: "break-word",
              maxWidth: "100%",
              ...props.style,
            }}
          />
        </div>

        {/* Fade overlay when collapsed */}
        {!expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/90 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Button rendered separately - not inside scrollable container */}
      <div className="relative -mt-9 flex justify-center z-50">
        <button
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-all duration-200 bg-[#0c0c0c]/95 hover:bg-[#1a1a1a]/95 border border-zinc-600/30 rounded-md shadow-lg backdrop-blur-sm"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              Show less
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </>
          ) : (
            <>
              Show {codeLines.length - 15} more lines
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </>
          )}
        </button>
      </div>
    </>
  );
}
