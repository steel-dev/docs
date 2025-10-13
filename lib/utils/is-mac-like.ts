export function isMacLike(): boolean {
  const ua = navigator.userAgent.toLowerCase();

  // Classic macOS detection
  if (ua.includes('mac os x')) return true;

  // iPad/iPhone also use the ⌘ key when a hardware keyboard is attached
  if (/iphone|ipad|ipod/.test(ua)) return true;

  return false;
}

export function shortcutLabel(key: string = 'K'): string {
  return isMacLike() ? `Cmd+${key.toUpperCase()}` : `Ctrl+${key.toUpperCase()}`;
}
