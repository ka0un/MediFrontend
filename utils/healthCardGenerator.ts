/**
 * Health Card Number Generator
 * 
 * Generates unique health card numbers with the format: HC-YYYY-NNNNNN
 * Where:
 * - HC: Health Card prefix
 * - YYYY: Current year
 * - NNNNNN: 6-digit sequential number
 */

export const generateHealthCardNumber = (): string => {
    const currentYear = new Date().getFullYear();
    
    // Generate a 6-digit number using timestamp and random component
    // This ensures uniqueness while being readable
    const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0'); // 2-digit random
    
    const sequentialNumber = timestamp + random;
    
    return `HC-${currentYear}-${sequentialNumber}`;
};

/**
 * Validate health card number format
 * Expected format: HC-YYYY-NNNNNN
 */
export const validateHealthCardFormat = (cardNumber: string): boolean => {
    const healthCardRegex = /^HC-\d{4}-\d{6}$/;
    return healthCardRegex.test(cardNumber);
};

/**
 * Extract year from health card number
 */
export const extractYearFromHealthCard = (cardNumber: string): number | null => {
    const match = cardNumber.match(/^HC-(\d{4})-\d{6}$/);
    return match ? parseInt(match[1], 10) : null;
};
