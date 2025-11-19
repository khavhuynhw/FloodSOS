// Simple phone number validation and normalization
export function validatePhone(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid length (7-15 digits)
  return cleaned.length >= 7 && cleaned.length <= 15;
}

export function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  return phone.replace(/\D/g, '');
}

