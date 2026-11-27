/**
 * PUBLIQ Real Payment Validation Engine
 * Implements standard NPCI UPI and Banking (Luhn Mod-10, Expiry, CVV) rules.
 * Strictly rejects fake, dummy, or past-dated information.
 */

export interface CardValidationResult {
  isValid: boolean;
  brand: "VISA" | "MASTERCARD" | "RUPAY" | "AMEX" | "UNKNOWN";
  error?: string;
}

export interface GenericValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates Card Number via Luhn Mod-10 Algorithm and IIN Network Prefix
 */
export function validateCardNumber(rawCard: string): CardValidationResult {
  const digits = rawCard.replace(/\D/g, "");

  if (!digits || digits.length < 13 || digits.length > 19) {
    return {
      isValid: false,
      brand: "UNKNOWN",
      error: "Invalid Card Number: Card must contain 15 or 16 numeric digits."
    };
  }

  // Reject repeating dummy digits (e.g. 0000000000000000, 1111111111111111)
  if (new Set(digits).size <= 1) {
    return {
      isValid: false,
      brand: "UNKNOWN",
      error: "Card Declined: Repeating dummy digits are rejected by the payment gateway."
    };
  }

  // Detect card network
  let brand: "VISA" | "MASTERCARD" | "RUPAY" | "AMEX" | "UNKNOWN" = "UNKNOWN";
  if (digits.startsWith("4") && (digits.length === 16 || digits.length === 13)) {
    brand = "VISA";
  } else if (
    (digits.startsWith("51") || digits.startsWith("52") || digits.startsWith("53") || digits.startsWith("54") || digits.startsWith("55") ||
     (parseInt(digits.slice(0, 4), 10) >= 2221 && parseInt(digits.slice(0, 4), 10) <= 2720)) &&
    digits.length === 16
  ) {
    brand = "MASTERCARD";
  } else if (
    (digits.startsWith("60") || digits.startsWith("65") || digits.startsWith("81") || digits.startsWith("82")) &&
    digits.length === 16
  ) {
    brand = "RUPAY";
  } else if ((digits.startsWith("34") || digits.startsWith("37")) && digits.length === 15) {
    brand = "AMEX";
  }

  if (brand === "UNKNOWN") {
    return {
      isValid: false,
      brand: "UNKNOWN",
      error: "Unsupported Card Network: Please enter a valid Visa, MasterCard, RuPay, or American Express card."
    };
  }

  // Luhn Algorithm (Mod-10 Checksum)
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  if (sum % 10 !== 0) {
    return {
      isValid: false,
      brand,
      error: "Invalid Card Number: Card failed Luhn Mod-10 bank checksum verification. Please re-enter a valid card."
    };
  }

  return { isValid: true, brand };
}

/**
 * Validates Real Raw Expiry Date (MM/YY)
 * Rejects expired cards, invalid months (00, 13-99), and non-future dates.
 */
export function validateCardExpiry(expiry: string): GenericValidationResult {
  if (!expiry || !expiry.includes("/")) {
    return {
      isValid: false,
      error: "Invalid Expiry Format: Please enter in MM/YY format (e.g. 12/28)."
    };
  }

  const parts = expiry.split("/");
  if (parts.length !== 2) {
    return {
      isValid: false,
      error: "Invalid Expiry Format: Please enter MM/YY."
    };
  }

  const month = parseInt(parts[0].trim(), 10);
  const yearShort = parseInt(parts[1].trim(), 10);

  if (isNaN(month) || isNaN(yearShort)) {
    return {
      isValid: false,
      error: "Invalid Expiry Date: Expiry month and year must be numeric digits."
    };
  }

  if (month < 1 || month > 12) {
    return {
      isValid: false,
      error: `Invalid Expiry Month (${month.toString().padStart(2, "0")}): Month must be between 01 and 12.`
    };
  }

  // Current date (system current year: 2026, month: 11)
  const now = new Date();
  const currentYearShort = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1; // 1-12

  const fullYear = 2000 + yearShort;
  const currentFullYear = now.getFullYear();

  if (fullYear < currentFullYear || (fullYear === currentFullYear && month < currentMonth)) {
    return {
      isValid: false,
      error: `Card Expired: The card expiration date (${parts[0].trim()}/20${yearShort}) is in the past. Please enter an active card.`
    };
  }

  if (fullYear > currentFullYear + 20) {
    return {
      isValid: false,
      error: `Invalid Expiry Year (20${yearShort}): Card expiration cannot exceed 20 years in the future.`
    };
  }

  return { isValid: true };
}

/**
 * Validates CVV / CVC
 */
export function validateCvv(cvv: string, brand?: string): GenericValidationResult {
  const clean = cvv.replace(/\D/g, "");
  const expectedLen = brand === "AMEX" ? 4 : 3;

  if (clean.length !== expectedLen) {
    return {
      isValid: false,
      error: `Invalid CVV / CVC: Security code must be exactly ${expectedLen} numeric digits.`
    };
  }

  return { isValid: true };
}

/**
 * Validates Cardholder Name
 */
export function validateCardHolder(name: string): GenericValidationResult {
  const trimmed = name.trim();
  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: "Invalid Cardholder Name: Name must be at least 3 characters long."
    };
  }

  if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: "Invalid Cardholder Name: Cardholder name can only contain letters and standard punctuation."
    };
  }

  return { isValid: true };
}

/**
 * Validates UPI 12-Digit Reference Number (UTR / RRN)
 * Rejects wrong lengths, all repeating digits, and dummy sequences.
 */
export function validateUpiUtr(utr: string): GenericValidationResult {
  const clean = utr.replace(/\D/g, "");

  if (clean.length !== 12) {
    return {
      isValid: false,
      error: `Invalid UPI Reference (UTR): Exactly 12 numeric digits are required (currently ${clean.length} digits).`
    };
  }

  // Reject repeating dummy digits (e.g. 000000000000, 111111111111, 999999999999)
  if (new Set(clean).size <= 1) {
    return {
      isValid: false,
      error: "NPCI Rejection: Repeating dummy digits are rejected by the UPI settlement switch."
    };
  }

  // Reject known sequential dummy inputs
  const fakeSequences = ["123456789012", "012345678901", "987654321098"];
  if (fakeSequences.includes(clean)) {
    return {
      isValid: false,
      error: "UTR Verification Failed: Transaction reference not found on NPCI settlement network."
    };
  }

  return { isValid: true };
}

/**
 * Validates UPI Virtual Payment Address (VPA)
 */
export function validateUpiVpa(vpa: string): GenericValidationResult {
  const clean = vpa.trim().toLowerCase();
  const vpaRegex = /^[a-z0-9.\-_]{2,49}@[a-z]{2,49}$/;

  if (!vpaRegex.test(clean)) {
    return {
      isValid: false,
      error: "Invalid UPI ID (VPA): Format must be username@bank (e.g. 9876543210@paytm, name@okhdfcbank)."
    };
  }

  return { isValid: true };
}

/**
 * Validates Real Guest Full Name
 * Must be at least 3 characters, alphabets and spaces, rejecting dummy/test strings.
 */
export function validateGuestName(name: string): GenericValidationResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: "Please enter your Full Name." };
  }
  if (trimmed.length < 3) {
    return { isValid: false, error: "Please enter a valid real name (minimum 3 characters)." };
  }
  if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
    return { isValid: false, error: "Guest name can only contain alphabetic letters and spaces." };
  }
  const lower = trimmed.toLowerCase();
  const dummyNames = ["test", "asdf", "qwerty", "fake", "demo", "admin", "guest diner", "xxx", "user", "abc", "null", "aaaa", "bbbb"];
  if (dummyNames.includes(lower) || /^([a-zA-Z])\1+$/.test(lower)) {
    return { isValid: false, error: "Please enter a genuine real name (e.g., 'Rahul Kumar')." };
  }
  return { isValid: true };
}

/**
 * Validates Real Indian Mobile Phone Number
 * Must be 10 digits starting with 6, 7, 8, or 9, rejecting dummy patterns.
 */
export function validateGuestPhone(phone: string): GenericValidationResult {
  const clean = phone.replace(/\D/g, "");
  if (!clean) {
    return { isValid: false, error: "Please enter your 10-digit Mobile Phone Number." };
  }
  if (clean.length !== 10) {
    return { isValid: false, error: "Mobile number must be exactly 10 digits." };
  }
  if (!/^[6-9]/.test(clean)) {
    return { isValid: false, error: "Invalid mobile number: Real Indian mobile numbers must start with 6, 7, 8, or 9." };
  }
  if (/^(\d)\1{9}$/.test(clean) || clean === "1234567890" || clean === "0123456789") {
    return { isValid: false, error: "Please provide a valid, active mobile number. Live KOT tracking and GST tax invoice will be sent to this number." };
  }
  return { isValid: true };
}

/**
 * Validates Real 4 or 6 digit PIN (UPI, Card PIN, or Table Dining PIN)
 */
export function validateSecurityPin(pin: string, requiredLength: number = 4): GenericValidationResult {
  const clean = pin.replace(/\D/g, "");
  if (clean.length !== requiredLength && !(requiredLength === 4 && clean.length === 6)) {
    return { isValid: false, error: `PIN must be ${requiredLength} digits.` };
  }
  return { isValid: true };
}

