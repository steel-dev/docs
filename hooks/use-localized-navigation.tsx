'use client';

import { useMemo } from 'react';
import type { BaseLayoutProps } from '@/components/layouts/shared';
import { baseOptions } from '@/app/layout.config';

// Locale-free navigation using existing English base options
export function useLocalizedNavigation(): BaseLayoutProps['links'] {
  return useMemo(() => baseOptions.links, []);
}
