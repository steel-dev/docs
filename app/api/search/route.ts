import { createFromSource } from 'fumadocs-core/search/server';
import { source } from '@/lib/source';

// Cache the search API responses at runtime for optimal performance
export const revalidate = false;

const { GET: originalGET } = createFromSource(source);

export async function GET(request: Request) {
  // Return unfiltered search results
  return originalGET(request);
}
