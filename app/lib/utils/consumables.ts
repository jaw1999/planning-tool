export function isBalloonGas(name: string): boolean {
  const lowerName = name.toLowerCase();
  return lowerName.includes('helium') || lowerName.includes('hydrogen');
} 