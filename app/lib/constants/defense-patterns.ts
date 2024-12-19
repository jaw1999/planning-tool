export const DEFENSE_PATTERNS = {
  systemIdentifiers: [
    /[A-Z]-\d{1,3}/,           // e.g., M-16, F-35
    /[A-Z]{1,3}-\d{1,3}/,      // e.g., AH-64, UH-60
    /[A-Z]{2,4}\d{2,4}/,       // e.g., M1A1, AH64
    /[A-Z]{1,3}V\d{1,3}/,      // e.g., LAV25, AAV7
  ],
  categories: [
    'Aircraft',
    'Armor',
    'Artillery',
    'Communications',
    'Electronics',
    'Infantry',
    'Logistics',
    'Medical',
    'Naval',
    'Radar',
    'Vehicles',
    'Weapons'
  ]
}; 