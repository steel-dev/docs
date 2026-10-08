import { permanentRedirect } from 'next/navigation';
import { docsPath } from '@/lib/docs-path';

export default function OverviewPage() {
  permanentRedirect(docsPath('/'));
}
