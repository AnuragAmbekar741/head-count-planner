/**
 * Format number to K (thousands) or M (millions) format
 * @param value - Number to format
 * @param options - Formatting options
 * @returns Formatted string (e.g., "1.5M", "250K", "500")
 */
export function formatNumber(
  value: number,
  options?: {
    showDecimals?: boolean;
    minimumValue?: number; // Below this value, show full number
  }
): string {
  const { showDecimals = false, minimumValue = 1000 } = options || {};

  // If value is below minimum, show as is
  if (Math.abs(value) < minimumValue) {
    return value.toLocaleString(undefined, {
      maximumFractionDigits: showDecimals ? 2 : 0,
    });
  }

  // Format as millions
  if (Math.abs(value) >= 1_000_000) {
    const millions = value / 1_000_000;
    return showDecimals
      ? `${millions.toFixed(2)}M`
      : `${Math.round(millions * 10) / 10}M`;
  }

  // Format as thousands
  if (Math.abs(value) >= 1_000) {
    const thousands = value / 1_000;
    return showDecimals
      ? `${thousands.toFixed(2)}K`
      : `${Math.round(thousands * 10) / 10}K`;
  }

  // Fallback to regular formatting
  return value.toLocaleString(undefined, {
    maximumFractionDigits: showDecimals ? 2 : 0,
  });
}

/**
 * Format currency with K/M abbreviations
 * @param value - Amount to format
 * @param options - Formatting options
 * @returns Formatted string with $ prefix (e.g., "$1.5M", "$250K", "$500")
 */
export function formatCurrency(
  value: number,
  options?: {
    showDecimals?: boolean;
    minimumValue?: number;
  }
): string {
  return `$${formatNumber(value, options)}`;
}
