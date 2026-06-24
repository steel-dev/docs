'use client';

import { Tabs as FumaTabs, TabsList, TabsTrigger } from 'fumadocs-ui/components/tabs';
import type { ComponentProps, ReactElement, SVGProps } from 'react';
import { Children, cloneElement, isValidElement, useLayoutEffect, useRef } from 'react';
import { useStateOrLocalStorage } from '@/components/docskit/hooks/local-storage';
import { GoIcon, PythonIcon, RustIcon, TSIcon } from '@/components/ui/icon';

type IconComponent = (props: SVGProps<SVGSVGElement>) => ReactElement;

const LANG_ICONS: Record<string, { Icon: IconComponent; className: string }> = {
  typescript: { Icon: TSIcon, className: '!size-[13px]' },
  python: { Icon: PythonIcon, className: '!size-[15px]' },
  go: { Icon: GoIcon, className: '!size-[18px]' },
  rust: { Icon: RustIcon, className: '!size-[15px]' },
};

function escapeValue(value: string) {
  return value.toLowerCase().replace(/\s/, '-');
}

export function Tabs({ items, ...props }: ComponentProps<typeof FumaTabs>) {
  if (!items) {
    return <FumaTabs {...props} />;
  }
  return <LangTabs items={items} {...props} />;
}

function LangTabs({
  items,
  defaultIndex = 0,
  children,
  groupId,
  persist = false,
  updateAnchor = false,
  ...props
}: ComponentProps<typeof FumaTabs> & { items: string[] }) {
  const values = items.map(escapeValue);
  const fallback = values[defaultIndex] ?? values[0];

  const childArr = Children.toArray(children).filter(isValidElement) as ReactElement<{
    id?: string;
    value?: string;
  }>[];
  const withValues = childArr.map((child, i) =>
    cloneElement(child, { value: child.props.value ?? child.props.id ?? values[i] }),
  );

  const [stored, setStored] = useStateOrLocalStorage(persist ? groupId : undefined, fallback);
  const active = values.includes(stored) ? stored : fallback;

  const hashApplied = useRef(false);
  useLayoutEffect(() => {
    if (hashApplied.current || !updateAnchor) return;
    hashApplied.current = true;
    const hash = window.location.hash.slice(1);
    if (hash && values.includes(hash)) {
      setStored(hash);
    }
  }, [updateAnchor, values, setStored]);

  const handleChange = (value: string) => {
    setStored(value);
    if (updateAnchor && typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${value}`);
    }
  };

  return (
    <FumaTabs {...props} value={active} onValueChange={handleChange}>
      <TabsList>
        {items.map((item, i) => {
          const icon = LANG_ICONS[values[i]];
          return (
            <TabsTrigger key={item} value={values[i]} className="cursor-pointer !text-[13px]">
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
