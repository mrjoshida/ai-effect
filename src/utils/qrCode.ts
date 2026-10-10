import QRCode from 'qrcode';

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
