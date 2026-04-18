/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

/**
 * Sanitize user input by escaping HTML entities
 */
export function sanitizeInput(input: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return input.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validate phone number (Kazakhstan format: +7 XXX XXX XXXX)
 */
export function isValidPhoneKz(phone: string): boolean {
  const phoneRegex = /^\+7\d{10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Remove potentially dangerous characters from user input
 */
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/\0/g, "") // Remove null bytes
    .replace(/[\r\n]+/g, "\n") // Normalize line breaks
    .substring(0, 2000); // Limit length
}
