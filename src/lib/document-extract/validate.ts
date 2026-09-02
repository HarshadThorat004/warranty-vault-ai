const GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const GSTIN_BODY =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z$/;

const GSTIN_FULL =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function gstinCheckDigit(first14: string) {
  const input = first14.trim().toUpperCase();

  if (!GSTIN_BODY.test(input)) {
    throw new Error("GSTIN body must be 14 characters before the check digit");
  }

  let factor = 1;
  let total = 0;
  const modulus = GSTIN_CHARS.length;

  for (let i = 0; i < 14; i += 1) {
    const codePoint = GSTIN_CHARS.indexOf(input[i] ?? "");
    let digit = factor * codePoint;
    factor = factor === 2 ? 1 : 2;
    digit = Math.floor(digit / modulus) + (digit % modulus);
    total += digit;
  }

  const checksum = (modulus - (total % modulus)) % modulus;
  return GSTIN_CHARS[checksum] ?? "";
}

export function isValidGstin(value: string) {
  const gstin = value.trim().toUpperCase();

  if (!GSTIN_FULL.test(gstin)) {
    return false;
  }

  return gstinCheckDigit(gstin.slice(0, 14)) === gstin[14];
}

export function findGstins(text: string) {
  const matches = text.toUpperCase().match(/[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]/g);

  if (!matches) return [];

  return [...new Set(matches)].filter(isValidGstin);
}

export function isValidImei(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length !== 15) {
    return false;
  }

  return luhnValid(digits);
}

function luhnValid(digits: string) {
  let sum = 0;
  let doubleDigit = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);

    if (doubleDigit) {
      n *= 2;
      if (n > 9) n -= 9;
    }

    sum += n;
    doubleDigit = !doubleDigit;
  }

  return sum % 10 === 0;
}
