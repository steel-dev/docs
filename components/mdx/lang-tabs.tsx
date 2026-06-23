'use client';

import { Tabs as FumaTabs, TabsList, TabsTrigger } from 'fumadocs-ui/components/tabs';
import type { ComponentProps, ReactElement, SVGProps } from 'react';
import { Children, cloneElement, isValidElement } from 'react';
import { GoIcon, PythonIcon, RustIcon, TSIcon } from '@/components/ui/icon';

type IconComponent = (props: SVGProps<SVGSVGElement>) => ReactElement;

const LANG_ICONS: Record<string, { Icon: IconComponent; className: string }> = {
  typescript: { Icon: TSIcon, className: '!size-3.5' },
  python: { Icon: PythonIcon, className: '!size-4' },
  go: { Icon: GoIcon, className: '!size-5' },
  rust: { Icon: RustIcon, className: '!size-4' },
};

function escapeValue(value: string) {
  return value.toLowerCase().replace(/\s/, '-');
}

export function Tabs({
  items,
  defaultIndex = 0,
  children,
  ...props
}: ComponentProps<typeof FumaTabs>) {
  if (!items) {
    return <FumaTabs {...props}>{children}</FumaTabs>;
  }

  const values = items.map(escapeValue);
  const tabs = Children.toArray(children).filter(isValidElement) as ReactElement<{
    id?: string;
    value?: string;
  }>[];
  const withValues = tabs.map((child, i) =>
    cloneElement(child, { value: child.props.value ?? child.props.id ?? values[i] }),
  );

  return (
    <FumaTabs {...props} defaultValue={values[defaultIndex]}>
      <TabsList>
        {items.map((item, i) => {
          const icon = LANG_ICONS[values[i]];
          return (
            <TabsTrigger key={item} value={values[i]} className="cursor-pointer">
              {icon ? <icon.Icon className={icon.className} /> : null}
              {item}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {withValues}
    </FumaTabs>
  );
}
