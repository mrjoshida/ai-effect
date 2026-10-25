import QRCode from 'qrcode';
import { getCachedCapabilities } from './capabilities';

export function buildJoinUrl(code: string): string {
  const cleanCode = encodeURIComponent(code.trim().toUpperCase());
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?code=${cleanCode}`;
  }
  return `https://therithmproject.github.io/ai-effect/?code=${cleanCode}`;
}

export async function generateJoinQrSvg(joinUrl: string): Promise<string> {
  return QRCode.toString(joinUrl, {
    type: 'svg',
    margin: 1,
    color: {
      dark: '#1F1C18',
      light: '#FFFDF9',
    },
  });
}

export function formatShortJoinLink(joinUrl: string): string {
  const prefix = getCachedCapabilities()?.shortJoinPrefix;
  if (prefix) {
    const codeMatch = joinUrl.match(/[?&]code=([A-Za-z0-9-]+)/);
    if (codeMatch && codeMatch[1]) {
      return `${prefix.replace(/\/+$/, '')}/${codeMatch[1].toUpperCase()}`;
    }
    return prefix.replace(/\/+$/, '');
  }
  let cleaned = joinUrl.trim().replace(/^https?:\/\//i, '');
  cleaned = cleaned.replace(/\/+\?/, '/?');
  if (!cleaned.includes('?')) {
    cleaned = cleaned.replace(/\/+$/, '');
  }
  return cleaned;
}

export function formatBaseJoinDomain(joinUrl: string): string {
  const prefix = getCachedCapabilities()?.shortJoinPrefix;
  if (prefix) {
    return prefix.replace(/\/+$/, '');
  }
  let cleaned = joinUrl.trim().replace(/^https?:\/\//i, '');
  cleaned = cleaned.split('?')[0].split('#')[0];
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

