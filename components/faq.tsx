// ABOUTME: FAQ accordion section rendered from the :::faq MDX directive.
// ABOUTME: Emits FAQPage JSON-LD (built by remark-custom-directives) for search engines.

import type { ReactNode } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function FAQ({ jsonLd, children }: { jsonLd?: string; children: ReactNode }) {
  return (
    <section className="my-6">
      {jsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      ) : null}
      <Accordion type="single" collapsible className="w-full">
        {children}
      </Accordion>
    </section>
  );
}

export function FAQItem({ question, children }: { question: string; children: ReactNode }) {
  return (
    <AccordionItem value={question}>
      <AccordionTrigger className="text-base">{question}</AccordionTrigger>
      <AccordionContent>
        <div className="px-2 pb-4 text-fd-muted-foreground [&>p]:my-2">{children}</div>
      </AccordionContent>
    </AccordionItem>
  );
}
