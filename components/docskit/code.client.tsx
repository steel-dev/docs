"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CODEBLOCK, type CodeGroup, TITLEBAR } from "./code-group";
import { CopyButton } from "./copy-button";
import { useStateOrLocalStorage } from "./hooks/local-storage";

export function MultiCode({
  group,
  className,
}: {
  group: CodeGroup;
  className?: string;
}) {
  const [currentTitle, setCurrentTitle] = useStateOrLocalStorage(
    group.storage,
    group.tabs[0].title,
  );
  const current =
    group.tabs.find((tab) => tab.title === currentTitle) || group.tabs[0];

  const { style, code, filename } = current;

  return (
    <Tabs
      value={currentTitle}
      onValueChange={setCurrentTitle}
      className={cn(CODEBLOCK, className)}
      style={style}
    >
      <TabsList
        className={cn(
          TITLEBAR,
          "rounded-none p-0 pl-2 m-0 justify-start items-stretch !pt-0",
        )}
      >
        {group.tabs.map(({ icon, title }) => (
          <TabsTrigger
            key={title}
            value={title}
            className={cn(
              "rounded-none relative transition-colors duration-200 gap-2 px-3 font-mono flex items-center",
              "text-ch-tab-inactive-foreground data-[state=active]:text-foreground hover:text-muted-foreground cursor-pointer",
            )}
          >
            {icon}
            {title}
            {/* Light bar for active tab */}
            <div
              className="absolute left-0 right-0 bottom-0 h-0.5"
              style={{
                background: "#e0e7ff", // or use a custom color variable
                opacity: 0,
              }}
              data-active-bar
            />
          </TabsTrigger>
        ))}
      </TabsList>
      {filename && (
        <div
          className="flex items-center w-full text-sm font-mono border-b border-ch-border rounded-t-none"
          style={{ minHeight: 32 }}
        >
          <span className="pl-3 pr-2 flex-1 font-mono text-foreground">
            {filename}
          </span>
          <span className="h-4 border-l border-ch-border mx-2" />
          <span className="ml-auto pr-3">
            <CopyButton
              text={code}
              className="text-ch-tab-inactive-foreground"
            />
          </span>
        </div>
      )}

      <TabsContent
        // key={meta}
        value={current.title}
        className="mt-0 bg-background"
      >
        {current.pre}
      </TabsContent>
    </Tabs>
  );
}
