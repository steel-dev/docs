import type { AnnotationHandler } from 'codehike/code';
import { DocsLink as Link } from '@/components/docs-link';

export const link: AnnotationHandler = {
  name: 'link',
  Inline: ({ annotation, children }) => {
    const { query } = annotation;

    return (
      <Link href={query} className="underline">
        {children}
      </Link>
    );
  },
};
