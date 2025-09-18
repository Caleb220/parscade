/**
 * Enterprise-grade password validation utilities.
 * Implements comprehensive security requirements for password strength.
 */

export interface PasswordStrength {
  readonly score: number;
  readonly feedback: readonly string[];
  readonly isValid: boolean;
}

/**
 * Validates password strength according to enterprise security requirements.
 */
export const validatePassword = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  // Length check (minimum 12 characters for enterprise)
  if (password.length < 12) {
    feedback.push('At least 12 characters required');
  } else {
    score += 1;
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    feedback.push('Add uppercase letters');
  } else {
    score += 1;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    feedback.push('Add lowercase letters');
  } else {
    score += 1;
  }

  // Number check
  if (!/\d/.test(password)) {
    feedback.push('Add numbers');
  } else {
    score += 1;
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Add special characters (!@#$%^&*)');
  } else {
    score += 1;
  }

  // Common patterns check
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeating characters');
    score = Math.max(0, score - 1);
  }

  if (/123|abc|qwe|password|admin|user|test|12345678/i.test(password)) {
    feedback.push('Avoid common patterns');
    score = Math.max(0, score - 1);
  }

  const isValid = score >= 5 && feedback.length === 0;

  return {
    score: Math.min(score, 5),
    feedback,
    isValid,
  };
};

/**
 * Gets password strength label for display.
 */
export const getPasswordStrengthLabel = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return 'Very Weak';
    case 2:
      return 'Weak';
    case 3:
      return 'Fair';
    case 4:
      return 'Good';
    case 5:
      return 'Strong';
    default:
      return 'Very Weak';
  }
};

/**
 * Gets password strength color for display.
 */
export const getPasswordStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return 'bg-red-500';
    case 2:
      return 'bg-orange-500';
    case 3:
      return 'bg-yellow-500';
    case 4:
      return 'bg-blue-500';
    case 5:
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
};