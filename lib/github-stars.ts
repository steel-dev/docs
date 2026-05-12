const STEEL_BROWSER_REPO = 'steel-dev/steel-browser';
const FALLBACK_STARS = 7000;
const REVALIDATE_SECONDS = 3600;

export async function getSteelBrowserStars(): Promise<number> {
  try {
    const res = await fetch(`https://api.github.com/repos/${STEEL_BROWSER_REPO}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return FALLBACK_STARS;
    const data = await res.json();
    return typeof data?.stargazers_count === 'number' ? data.stargazers_count : FALLBACK_STARS;
  } catch {
    return FALLBACK_STARS;
  }
}
