export function isBalloonGas(name: string): boolean {
  return name.toLowerCase().includes('balloon') || 
         name.toLowerCase().includes('helium') || 
         name.toLowerCase().includes('hydrogen');
} 