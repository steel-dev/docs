import {
  type AnnotationHandler,
  highlight,
  Pre,
  type RawCode,
} from "codehike/code";
import { CollapsiblePre } from "./collapsible-pre";
import React from "react";
import { cn } from "@/lib/utils";
import { callout } from "./annotations/callout";
import { collapse } from "./annotations/collapse";
import { diff } from "./annotations/diff";
import { fold } from "./annotations/fold";
import { hover } from "./annotations/hover";
import { lineNumbers } from "./annotations/line-numbers";
import { link } from "./annotations/link";
import { mark } from "./annotations/mark";
import { tokenTransitions } from "./annotations/token-transitions";
import { tooltip } from "./annotations/tooltip";
import { wordWrap } from "./annotations/word-wrap";
import { MultiCode } from "./code.client";
import {
  CODEBLOCK,
  type CodeGroup,
  flagsToOptions,
  TITLEBAR,
} from "./code-group";
import { CodeIcon } from "./code-icon";
import { CopyButton } from "./copy-button";
import theme from "./theme.mjs";

export async function Code(props: {
  codeblocks: RawCode[];
  flags?: string;
  storage?: string;
  className?: string;
  preClassName?: string;
}) {
  const group = await toCodeGroup({
    ...props,
    preClassName: props.preClassName,
  });
  return <CodeClient group={group} className={props.className} />;
}

// Client-side sync version
export function CodeSync(props: {
  codeblocks: RawCode[];
  flags?: string;
  storage?: string;
  className?: string;
  preClassName?: string;
  onLoad?: () => void;
}) {
  const [group, setGroup] = React.useState<CodeGroup | null>(null);

  React.useEffect(() => {
    toCodeGroup({ ...props, preClassName: props.preClassName }).then((g) => {
      setGroup(g);
      props.onLoad?.();
    });
  }, [props.codeblocks, props.flags, props.storage, props.preClassName]);

  if (!group) {
    return <div className={cn(CODEBLOCK, props.className)} />;
  }

  return <CodeClient group={group} className={props.className} />;
}

// Shared client component
function CodeClient({
  group,
  className,
}: {
  group: CodeGroup;
  className?: string;
}) {
  return group.tabs.length === 1 ? (
    <SingleCode group={group} className={className} />
  ) : (
    <MultiCode group={group} key={group.storage} className={className} />
  );
}

function SingleCode({
  group,
  className,
}: {
  group: CodeGroup;
  className?: string;
}) {
  const tab = group.tabs[0];
  if (!tab) return null;

  const { pre, style, code, title, icon, options, filename } = tab;
  const hasTitle = title?.trim() !== "";
  return (
    <div
      className={cn(
        CODEBLOCK,
        !hasTitle && "border-none",
        className,
        "rounded-lg",
      )}
      style={style}
    >
      {hasTitle && (
        <div
          className={cn(
            TITLEBAR,
            "flex items-center gap-2",
            "text-muted-foreground text-sm font-mono",
          )}
        >
          <span className="pl-2 pr-1">{icon}</span>
          {title}
          {options.copyButton && filename === "" && (
            <div className={cn("ml-auto mr-1 items-center")}>
              <CopyButton
                text={code}
                className="text-ch-tab-inactive-foreground"
              />
            </div>
          )}
        </div>
      )}
      {filename && (
        <div
          className="flex items-center w-full text-sm font-mono rounded-t-none bg-[var(--ch-0)] p-1"
          style={{ minHeight: 32 }}
        >
          <span className="pl-2 pr-2 flex-1 font-mono text-foreground">
            {filename}
          </span>
          <span className="ml-auto pr-3">
            <CopyButton
              text={code}
              className="text-ch-tab-inactive-foreground text-muted-foreground"
            />
          </span>
        </div>
      )}

      {options.copyButton && !hasTitle && (
        <CopyButton
          text={code}
          className="absolute right-4 my-0 top-2 text-ch-tab-inactive-foreground z-10"
        />
      )}
      {pre}
    </div>
  );
}

export async function toCodeGroup(props: {
  codeblocks: RawCode[];
  flags?: string;
  storage?: string;
  preClassName?: string;
}): Promise<CodeGroup> {
  const groupOptions = flagsToOptions(props.flags);

  const tabs = await Promise.all(
    props.codeblocks.map(async (tab) => {
      const { flags, title, filename } = extractFlags(tab);
      const tabOptions = flagsToOptions(flags);
      const options = { ...groupOptions, ...tabOptions };
      const highlighted = await highlight(tab, theme);
      const handlers = getHandlers(options);
      return {
        options,
        title,
        filename,
        style: highlighted.style,
        code: highlighted.code,
        icon: <CodeIcon title={title} lang={tab.lang} />,
        // pre: (
        //   <CollapsiblePre
        //     code={highlighted}
        //     className={cn(
        //       !title && "!m-0",
        //       "overflow-x-auto px-0 py-2 rounded-lg !bg-ch-code max-w-full", // rounded-lg
        //       props.preClassName,
        //     )}
        //     style={highlighted.style}
        //     // handlers={handlers}
        //   />
        // ),

        pre: (
          <div className="bg-[var(--ch-0)] p-1">
            <Pre
              code={highlighted}
              className={cn(
                !title && "!m-0",
                "overflow-x-auto p-3 rounded-lg font-mono bg-[var(--ch-18)] max-w-full",
                props.preClassName,
              )}
              style={{
                ...highlighted.style,
              }}
              handlers={handlers}
            />
          </div>
        ),
      };
    }),
  );

  return {
    storage: props.storage,
    options: groupOptions,
    tabs,
  };
}

function getHandlers(options: CodeGroup["options"]) {
  return [
    mark,
    tooltip,
    fold,
    link,
    options.animate && tokenTransitions,
    options.lineNumbers && lineNumbers,
    diff,
    ...collapse,
    options.wordWrap && wordWrap,
    callout,
    hover,
  ].filter(Boolean) as AnnotationHandler[];
}

/**
 * Extracts flags and title from the metadata of a code block.
 *
 * @example
 * ```typescript
 * const codeblock = { meta: "foo.js -abc" };
 * const { title, flags } = extractFlags(codeblock);
 * console.log(title); // "foo.js"
 * console.log(flags); // "abc"
 * ```
 */

function extractFlags(codeblock: RawCode) {
  // Support: foo.js -abc -f filename.txt
  const meta = codeblock.meta || "";
  const flagMatch = meta.match(/-(\w+)/);
  const fileMatch = meta.match(/-f\s+([^\s]+)/);
  const flags = flagMatch ? flagMatch[1] : "";
  const filename = fileMatch ? fileMatch[1] : "";
  // Remove flags and filename from title
  let title = meta
    .replace(flagMatch ? flagMatch[0] : "", "")
    .replace(fileMatch ? fileMatch[0] : "", "")
    .trim();
  return { title, flags, filename };
}
