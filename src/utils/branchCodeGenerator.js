/**
 * Utility functions for generating and validating branch codes
 */

/**
 * Generates a unique, human-readable branch code
 * Format: BRXX-YYYY (e.g., BR23-A4K9)
 * - Alphanumeric, uppercase only
 * - Easy to remember and type
 * - Low collision probability
 * @returns {string} A unique branch code
 */
export function generateBranchCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  // Generate 4 random characters for uniqueness
  let code = 'BR';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Add hyphen for readability: BR1234 -> BR12-34
  code = code.slice(0, 4) + '-' + code.slice(4);
  
  return code;
}

/**
 * Validates if a string is a valid branch code format
 * @param {string} code - The code to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidBranchCode(code) {
  if (!code || typeof code !== 'string') return false;
  
  // Match format: BRXX-YYYY or BRRXYY (with or without hyphen for backward compatibility)
  const branchCodePattern = /^BR[A-Z0-9]{2}-[A-Z0-9]{2}$/i;
  return branchCodePattern.test(code.toUpperCase());
}

/**
 * Normalizes a branch code by removing hyphens and converting to uppercase
 * @param {string} code - The code to normalize
 * @returns {string} Normalized code
 */
export function normalizeBranchCode(code) {
  if (!code) return '';
  return code.toUpperCase().replace(/-/g, '');
}
