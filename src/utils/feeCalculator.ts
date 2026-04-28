/**
 * Fee Calculator Utility
 * Implements tiered pricing structure based on Airtel Money withdrawal charges
 */

export function calculateTieredFee(amount: number): number {
  if (amount <= 0) return 0;
  
  // Airtel Money Withdrawal Tiers
  if (amount <= 150) return 2.50;
  if (amount <= 300) return 5.00;
  if (amount <= 500) return 10.00;
  if (amount <= 1000) return 20.00;
  if (amount <= 3000) return 35.00;
  if (amount <= 5000) return 55.00;
  if (amount <= 10000) return 60.00;
  
  // For amounts above 10,000, we'll continue with the 2% logic as a fallback
  // or cap it at 100? Let's use 2% for large amounts to ensure sustainability.
  return Math.max(60, amount * 0.02);
}
