import { validatePhone, normalizePhone } from '../../utils/phone';

describe('Phone utilities', () => {
  describe('validatePhone', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhone('1234567890')).toBe(true);
      expect(validatePhone('+1-234-567-8900')).toBe(true);
      expect(validatePhone('(123) 456-7890')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('12345678901234567')).toBe(false);
      expect(validatePhone('')).toBe(false);
    });
  });

  describe('normalizePhone', () => {
    it('should remove non-digit characters', () => {
      expect(normalizePhone('+1-234-567-8900')).toBe('12345678900');
      expect(normalizePhone('(123) 456-7890')).toBe('1234567890');
      expect(normalizePhone('123 456 7890')).toBe('1234567890');
    });
  });
});

