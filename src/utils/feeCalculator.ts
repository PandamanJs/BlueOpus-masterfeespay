/**
 * Fee Calculator Utility
 * Implements tiered pricing structure based on Airtel Money withdrawal charges
 */

export function calculateTieredFee(amount: number): number {
  if (amount <= 0) return 0;

  // Flat 1% Transaction Fee
  return amount * 0.001;
}
