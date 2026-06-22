export type StrengthResult = {
  score: number; // 0 to 4
  label: string; // Weak, Fair, Good, Strong, Excellent
  color: string; // Tailwind class
  suggestions: string[];
};

export function checkPasswordStrength(password: string): StrengthResult {
  if (!password) {
    return {
      score: 0,
      label: "Empty",
      color: "bg-zinc-200 dark:bg-zinc-800",
      suggestions: ["Enter a password to analyze its strength."]
    };
  }

  const suggestions: string[] = [];
  let points = 0;

  // Length checks
  if (password.length < 8) {
    suggestions.push("Make the password at least 8 characters long.");
    return {
      score: 0,
      label: "Weak (Too Short)",
      color: "bg-red-500",
      suggestions
    };
  }

  // +1 point for length >= 8
  points += 1;
  
  // Additional points for longer passwords
  if (password.length >= 12) points += 1;
  if (password.length >= 16) points += 1;

  // Complexity checks
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (hasUpper) points += 1;
  else suggestions.push("Add uppercase letters.");

  if (hasLower) points += 1;
  else suggestions.push("Add lowercase letters.");

  if (hasDigit) points += 1;
  else suggestions.push("Add numbers.");

  if (hasSpecial) points += 1;
  else suggestions.push("Add special characters (e.g., !, @, #, $, %).");

  // Max points possible: 3 (from length: 8, 12, 16) + 4 (from complexity checks) = 7 points
  let score = 0;
  let label = "Weak";
  let color = "bg-red-500";

  if (points >= 6) {
    score = 4;
    label = "Excellent";
    color = "bg-emerald-500";
  } else if (points >= 5) {
    score = 3;
    label = "Strong";
    color = "bg-blue-500";
  } else if (points >= 4) {
    score = 2;
    label = "Good";
    color = "bg-yellow-500";
  } else if (points >= 3) {
    score = 1;
    label = "Fair";
    color = "bg-orange-500";
  }

  return {
    score,
    label,
    color,
    suggestions
  };
}
