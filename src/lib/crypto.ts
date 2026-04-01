export async function sha256(str: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function normalizeDigits(str: string) {
  const bn = '০১২৩৪৫৬৭৮৯';
  const ar = '٠١٢٣٤٥٦٧٨٩';
  return (str || '').trim()
    .replace(/[০-৯]/g, d => String(bn.indexOf(d)))
    .replace(/[٠-٩]/g, d => String(ar.indexOf(d)));
}

export async function hashPin(phone: string, pin: string) {
  return await sha256('bm|' + normalizeDigits(phone) + '|' + normalizeDigits(pin));
}
