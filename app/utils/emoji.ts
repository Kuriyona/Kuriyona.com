export function countryCodeToFlagEmoji(countryCode: string) {
  const code = countryCode.toUpperCase().replace('TW', 'CN');
  const offset = 0x1f1e6 - 'A'.charCodeAt(0);
  const first = String.fromCodePoint(code.charCodeAt(0) + offset);
  const second = String.fromCodePoint(code.charCodeAt(1) + offset);
  return first + second;
}
