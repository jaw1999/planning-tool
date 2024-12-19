import { DEFENSE_PATTERNS } from '@/app/lib/constants/defense-patterns';
import * as compromise from 'compromise';

const nlp = compromise.default;

export interface ParseResult {
  systemName: string;
  extractedFields: string[];
  missingFields: string[];
  rawData: Record<string, unknown>;
  confidence: Record<string, number>;
  relatedSystems?: string[];
  categories?: string[];
  entities?: {
    organizations: string[];
    locations: string[];
    dates: string[];
    people: string[];
  };
}

export async function parseFile(buffer: ArrayBuffer, fileType: string): Promise<ParseResult> {
  switch (fileType) {
    case 'pdf':
      // For PDFs, we'll need to handle the parsing on the server side
      const formData = new FormData();
      formData.append('file', new Blob([buffer]));
      
      try {
        const response = await fetch('/api/parse/pdf', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('PDF parsing failed');
        }
        
        const text = await response.text();
        return processText(text);
      } catch (error) {
        console.error('PDF parsing failed:', error);
        throw new Error('Failed to parse PDF file');
      }
    case 'json':
      return parseJSON(buffer);
    case 'csv':
      return parseCSV(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

function processText(text: string): ParseResult {
  // Process text with compromise
  const doc = nlp(text);

  // Extract entities
  const entities = {
    organizations: doc.organizations().out('array'),
    locations: doc.places().out('array'),
    dates: doc.dates().out('array'),
    people: doc.people().out('array')
  };

  // Extract system information
  const systemInfo = extractSystemInformation(text);
  
  // Analyze content
  const { 
    extractedFields, 
    missingFields, 
    rawData, 
    confidence 
  } = analyzeContent(text);

  // Find related systems
  const relatedSystems = findRelatedSystems(text);

  // Categorize the system
  const categories = categorizeSystem(text, rawData);

  return {
    ...systemInfo,
    extractedFields,
    missingFields,
    rawData,
    confidence,
    relatedSystems,
    categories,
    entities
  };
}

function findRelatedSystems(text: string): string[] {
  const relatedSystems: string[] = [];
  const lines = text.split('\n');

  DEFENSE_PATTERNS.systemIdentifiers.forEach((pattern) => {
    lines.forEach(line => {
      const matches = line.match(pattern);
      if (matches) {
        relatedSystems.push(...matches);
      }
    });
  });

  return [...new Set(relatedSystems)];
}

function extractSystemInformation(text: string) {
  const lines = text.split('\n');
  let systemName = 'Unknown System';
  let highestConfidence = 0;

  for (const line of lines) {
    for (const pattern of DEFENSE_PATTERNS.systemIdentifiers) {
      const match = line.match(pattern);
      if (match) {
        const surroundingText = line.substring(
          Math.max(0, match.index! - 30),
          Math.min(line.length, match.index! + match[0].length + 30)
        );
        
        // Simple confidence calculation based on keyword presence
        const confidence = calculateSimpleConfidence(surroundingText);
        
        if (confidence > highestConfidence) {
          systemName = surroundingText.trim();
          highestConfidence = confidence;
        }
      }
    }
  }

  return { systemName };
}

function calculateSimpleConfidence(text: string): number {
  const militaryKeywords = [
    'tactical', 'operational', 'strategic', 'combat', 'military',
    'defense', 'weapon', 'system', 'platform', 'capability'
  ];
  
  const words = text.toLowerCase().split(/\s+/);
  const matchCount = words.filter(word => militaryKeywords.includes(word)).length;
  
  return Math.min(matchCount * 0.2, 1);
}

function analyzeContent(text: string) {
  const expectedFields = [
    { name: 'name', patterns: [/name[:\s]+([^\n]+)/i, /designation[:\s]+([^\n]+)/i] },
    { name: 'description', patterns: [/description[:\s]+([^\n]+)/i, /overview[:\s]+([^\n]+)/i] },
    { name: 'category', patterns: [/category[:\s]+([^\n]+)/i, /type[:\s]+([^\n]+)/i] },
    // ... other fields
  ];

  const extractedFields: string[] = [];
  const missingFields: string[] = [];
  const rawData: Record<string, unknown> = {};
  const confidence: Record<string, number> = {};

  expectedFields.forEach(field => {
    let bestMatch = null;
    let highestConfidence = 0;

    field.patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        const matchConfidence = calculateSimpleConfidence(matches[1]);
        if (matchConfidence > highestConfidence) {
          highestConfidence = matchConfidence;
          bestMatch = matches[1].trim();
        }
      }
    });

    if (bestMatch) {
      extractedFields.push(field.name);
      rawData[field.name] = bestMatch;
      confidence[field.name] = highestConfidence;
    } else {
      missingFields.push(field.name);
      confidence[field.name] = 0;
    }
  });

  return { extractedFields, missingFields, rawData, confidence };
}

function categorizeSystem(text: string, rawData: Record<string, unknown>): string[] {
  const categories: string[] = [];
  const combinedText = `${text} ${Object.values(rawData).join(' ')}`.toLowerCase();

  DEFENSE_PATTERNS.categories.forEach(category => {
    if (combinedText.includes(category.toLowerCase())) {
      categories.push(category);
    }
  });

  return categories;
}

function parseCSV(buffer: ArrayBuffer): ParseResult {
  throw new Error('CSV parsing not yet implemented');
}

function parseJSON(buffer: ArrayBuffer): ParseResult {
  try {
    const text = new TextDecoder().decode(buffer);
    const data = JSON.parse(text);
    const relatedSystems = findRelatedSystems(JSON.stringify(data));
    
    return {
      systemName: data.systemName || 'Unknown System',
      extractedFields: Object.keys(data),
      missingFields: [],
      rawData: data,
      confidence: { json: 1.0 },
      relatedSystems
    };
  } catch (error) {
    console.error('JSON parsing failed:', error);
    throw new Error('Failed to parse JSON file');
  }
}

export { DEFENSE_PATTERNS }; 