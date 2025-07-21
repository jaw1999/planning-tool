import { PrismaClient } from '@prisma/client';
import { cache } from './cache';

const prisma = new PrismaClient();

export interface SearchQuery {
  query: string;
  filters?: Record<string, any>;
  facets?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  entityTypes?: ('exercise' | 'system' | 'equipment' | 'user')[];
}

export interface SearchResult<T = any> {
  items: T[];
  total: number;
  facets: Record<string, Array<{ value: string; count: number }>>;
  suggestions: string[];
  executionTime: number;
  page: number;
  limit: number;
}

export interface SearchableEntity {
  id: string;
  type: 'exercise' | 'system' | 'equipment' | 'user';
  title: string;
  description?: string;
  content: string;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  searchScore?: number;
}

export class AdvancedSearchEngine {
  private searchIndex: Map<string, SearchableEntity> = new Map();
  private wordIndex: Map<string, Set<string>> = new Map();
  private facetIndex: Map<string, Map<string, Set<string>>> = new Map();

  constructor() {
    this.initializeSearchIndex();
  }

  // Initialize search index with all searchable entities
  async initializeSearchIndex(): Promise<void> {
    console.log('Initializing search index...');
    
    try {
      await Promise.all([
        this.indexExercises(),
        this.indexSystems(),
        this.indexEquipment(),
        this.indexUsers()
      ]);

      this.buildWordIndex();
      this.buildFacetIndex();
      
      console.log(`Search index initialized with ${this.searchIndex.size} documents`);
    } catch (error) {
      console.error('Failed to initialize search index:', error);
    }
  }

  // Index exercises
  private async indexExercises(): Promise<void> {
    const exercises = await prisma.exercise.findMany({
      include: {
        systems: {
          include: { system: true }
        }
      }
    });

    for (const exercise of exercises) {
      const systemNames = exercise.systems.map(es => es.system.name).join(' ');
      const content = [
        exercise.name,
        exercise.description,
        exercise.location,
        exercise.status,
        systemNames
      ].filter(Boolean).join(' ');

      const entity: SearchableEntity = {
        id: exercise.id,
        type: 'exercise',
        title: exercise.name,
        description: exercise.description || undefined,
        content: content.toLowerCase(),
        tags: [exercise.status, exercise.location].filter(Boolean),
        metadata: {
          startDate: exercise.startDate,
          endDate: exercise.endDate,
          totalBudget: exercise.totalBudget,
          systemsCount: exercise.systems.length,
          status: exercise.status,
          location: exercise.location
        },
        createdAt: exercise.createdAt,
        updatedAt: exercise.updatedAt
      };

      this.searchIndex.set(exercise.id, entity);
    }
  }

  // Index systems
  private async indexSystems(): Promise<void> {
    const systems = await prisma.system.findMany();

    for (const system of systems) {
      const content = [
        system.name,
        system.description
      ].filter(Boolean).join(' ');

      const entity: SearchableEntity = {
        id: system.id,
        type: 'system',
        title: system.name,
        description: system.description || undefined,
        content: content.toLowerCase(),
        tags: [
          system.hasLicensing ? 'licensed' : 'unlicensed',
          system.basePrice > 100000 ? 'high-cost' : 'low-cost'
        ],
        metadata: {
          basePrice: system.basePrice,
          hasLicensing: system.hasLicensing,
          licensePrice: system.licensePrice,
          leadTime: system.leadTime,
          consumablesRate: system.consumablesRate
        },
        createdAt: system.createdAt,
        updatedAt: system.updatedAt
      };

      this.searchIndex.set(system.id, entity);
    }
  }

  // Index equipment
  private async indexEquipment(): Promise<void> {
    const equipment = await prisma.equipment.findMany();

    for (const eq of equipment) {
      const productInfo = eq.productInfo as any || {};
      const content = [
        productInfo.name,
        productInfo.model,
        productInfo.type,
        eq.location,
        eq.status
      ].filter(Boolean).join(' ');

      const entity: SearchableEntity = {
        id: eq.id,
        type: 'equipment',
        title: productInfo.name || 'Unknown Equipment',
        description: productInfo.description,
        content: content.toLowerCase(),
        tags: [
          eq.status,
          productInfo.type,
          productInfo.classification?.level
        ].filter(Boolean),
        metadata: {
          model: productInfo.model,
          type: productInfo.type,
          status: eq.status,
          acquisitionCost: eq.acquisitionCost,
          location: eq.location,
          serialNumber: eq.serialNumber
        },
        createdAt: eq.createdAt,
        updatedAt: eq.updatedAt
      };

      this.searchIndex.set(eq.id, entity);
    }
  }

  // Index users
  private async indexUsers(): Promise<void> {
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' }
    });

    for (const user of users) {
      const content = [
        user.name,
        user.email,
        user.role
      ].filter(Boolean).join(' ');

      const entity: SearchableEntity = {
        id: user.id,
        type: 'user',
        title: user.name || user.email,
        content: content.toLowerCase(),
        tags: [user.role, user.status],
        metadata: {
          email: user.email,
          role: user.role,
          status: user.status
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      this.searchIndex.set(user.id, entity);
    }
  }

  // Build word index for fast text search
  private buildWordIndex(): void {
    this.wordIndex.clear();

    for (const [id, entity] of this.searchIndex) {
      const words = this.tokenize(entity.content);
      
      for (const word of words) {
        if (!this.wordIndex.has(word)) {
          this.wordIndex.set(word, new Set());
        }
        this.wordIndex.get(word)!.add(id);
      }
    }
  }

  // Build facet index for faceted search
  private buildFacetIndex(): void {
    this.facetIndex.clear();

    for (const [id, entity] of this.searchIndex) {
      // Index by entity type
      this.addToFacetIndex('type', entity.type, id);

      // Index by tags
      for (const tag of entity.tags) {
        this.addToFacetIndex('tags', tag, id);
      }

      // Index by metadata fields
      for (const [key, value] of Object.entries(entity.metadata)) {
        if (typeof value === 'string') {
          this.addToFacetIndex(key, value, id);
        }
      }
    }
  }

  private addToFacetIndex(facet: string, value: string, entityId: string): void {
    if (!this.facetIndex.has(facet)) {
      this.facetIndex.set(facet, new Map());
    }
    
    const facetMap = this.facetIndex.get(facet)!;
    if (!facetMap.has(value)) {
      facetMap.set(value, new Set());
    }
    
    facetMap.get(value)!.add(entityId);
  }

  // Perform advanced search
  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = `search:${JSON.stringify(query)}`;
      const cached = await cache.get<SearchResult>(cacheKey);
      if (cached) {
        return cached;
      }

      let candidateIds = new Set<string>();

      // Text search
      if (query.query.trim()) {
        candidateIds = this.performTextSearch(query.query);
      } else {
        // If no text query, start with all entities
        candidateIds = new Set(this.searchIndex.keys());
      }

      // Apply filters
      if (query.filters) {
        candidateIds = this.applyFilters(candidateIds, query.filters);
      }

      // Filter by entity types
      if (query.entityTypes && query.entityTypes.length > 0) {
        candidateIds = this.filterByEntityTypes(candidateIds, query.entityTypes);
      }

      // Get entities and calculate scores
      const entities = Array.from(candidateIds)
        .map(id => this.searchIndex.get(id)!)
        .filter(Boolean);

      // Score and rank results
      const scoredEntities = this.scoreResults(entities, query.query);

      // Sort results
      const sortedEntities = this.sortResults(scoredEntities, query.sortBy, query.sortOrder);

      // Paginate
      const page = query.page || 1;
      const limit = query.limit || 20;
      const startIndex = (page - 1) * limit;
      const paginatedEntities = sortedEntities.slice(startIndex, startIndex + limit);

      // Generate facets
      const facets = this.generateFacets(entities, query.facets);

      // Generate suggestions
      const suggestions = this.generateSuggestions(query.query);

      const result: SearchResult = {
        items: paginatedEntities,
        total: sortedEntities.length,
        facets,
        suggestions,
        executionTime: Date.now() - startTime,
        page,
        limit
      };

      // Cache the result
      await cache.set(cacheKey, result, { ttl: 300 }); // 5 minutes

      return result;
    } catch (error) {
      console.error('Search error:', error);
      return {
        items: [],
        total: 0,
        facets: {},
        suggestions: [],
        executionTime: Date.now() - startTime,
        page: query.page || 1,
        limit: query.limit || 20
      };
    }
  }

  // Perform text search using word index
  private performTextSearch(queryText: string): Set<string> {
    const words = this.tokenize(queryText);
    const results = new Set<string>();

    if (words.length === 0) {
      return new Set(this.searchIndex.keys());
    }

    // Find entities that contain any of the search words
    for (const word of words) {
      const exactMatches = this.wordIndex.get(word) || new Set();
      
      // Also find partial matches
      const partialMatches = this.findPartialMatches(word);
      
      for (const id of [...exactMatches, ...partialMatches]) {
        results.add(id);
      }
    }

    return results;
  }

  private findPartialMatches(word: string): Set<string> {
    const matches = new Set<string>();
    
    for (const [indexWord, entityIds] of this.wordIndex) {
      if (indexWord.includes(word) || word.includes(indexWord)) {
        for (const id of entityIds) {
          matches.add(id);
        }
      }
    }
    
    return matches;
  }

  // Apply filters to search results
  private applyFilters(candidateIds: Set<string>, filters: Record<string, any>): Set<string> {
    const filtered = new Set<string>();

    for (const id of candidateIds) {
      const entity = this.searchIndex.get(id);
      if (!entity) continue;

      let matches = true;

      for (const [filterKey, filterValue] of Object.entries(filters)) {
        if (filterValue === null || filterValue === undefined || filterValue === '') {
          continue;
        }

        const entityValue = entity.metadata[filterKey];
        
        if (Array.isArray(filterValue)) {
          if (!filterValue.includes(entityValue)) {
            matches = false;
            break;
          }
        } else if (typeof filterValue === 'object' && filterValue.min !== undefined || filterValue.max !== undefined) {
          // Range filter
          if (filterValue.min !== undefined && entityValue < filterValue.min) {
            matches = false;
            break;
          }
          if (filterValue.max !== undefined && entityValue > filterValue.max) {
            matches = false;
            break;
          }
        } else if (entityValue !== filterValue) {
          matches = false;
          break;
        }
      }

      if (matches) {
        filtered.add(id);
      }
    }

    return filtered;
  }

  // Filter by entity types
  private filterByEntityTypes(candidateIds: Set<string>, entityTypes: string[]): Set<string> {
    const filtered = new Set<string>();

    for (const id of candidateIds) {
      const entity = this.searchIndex.get(id);
      if (entity && entityTypes.includes(entity.type)) {
        filtered.add(id);
      }
    }

    return filtered;
  }

  // Score search results based on relevance
  private scoreResults(entities: SearchableEntity[], queryText: string): SearchableEntity[] {
    if (!queryText.trim()) {
      return entities.map(entity => ({ ...entity, searchScore: 1 }));
    }

    const queryWords = this.tokenize(queryText);

    return entities.map(entity => {
      let score = 0;
      const entityWords = this.tokenize(entity.content);

      // Exact matches in title get highest score
      if (entity.title.toLowerCase().includes(queryText.toLowerCase())) {
        score += 10;
      }

      // Word matches
      for (const queryWord of queryWords) {
        // Exact word matches
        const exactMatches = entityWords.filter(word => word === queryWord).length;
        score += exactMatches * 5;

        // Partial matches
        const partialMatches = entityWords.filter(word => 
          word.includes(queryWord) || queryWord.includes(word)
        ).length;
        score += partialMatches * 2;

        // Tag matches
        const tagMatches = entity.tags.filter(tag => 
          tag.toLowerCase().includes(queryWord)
        ).length;
        score += tagMatches * 3;
      }

      // Boost newer content
      const daysSinceUpdate = (Date.now() - entity.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 7) {
        score += 1;
      }

      return { ...entity, searchScore: score };
    });
  }

  // Sort search results
  private sortResults(
    entities: SearchableEntity[], 
    sortBy?: string, 
    sortOrder: 'asc' | 'desc' = 'desc'
  ): SearchableEntity[] {
    const multiplier = sortOrder === 'desc' ? -1 : 1;

    return entities.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
        case undefined:
          return ((b.searchScore || 0) - (a.searchScore || 0)) * multiplier;
        case 'title':
          return a.title.localeCompare(b.title) * multiplier;
        case 'created':
          return (a.createdAt.getTime() - b.createdAt.getTime()) * multiplier;
        case 'updated':
          return (a.updatedAt.getTime() - b.updatedAt.getTime()) * multiplier;
        default:
          return ((b.searchScore || 0) - (a.searchScore || 0)) * multiplier;
      }
    });
  }

  // Generate facets for search results
  private generateFacets(entities: SearchableEntity[], requestedFacets?: string[]): Record<string, Array<{ value: string; count: number }>> {
    const facets: Record<string, Record<string, number>> = {};
    
    const facetsToGenerate = requestedFacets || ['type', 'tags', 'status'];

    for (const entity of entities) {
      // Type facet
      if (facetsToGenerate.includes('type')) {
        if (!facets.type) facets.type = {};
        facets.type[entity.type] = (facets.type[entity.type] || 0) + 1;
      }

      // Tags facet
      if (facetsToGenerate.includes('tags')) {
        if (!facets.tags) facets.tags = {};
        for (const tag of entity.tags) {
          facets.tags[tag] = (facets.tags[tag] || 0) + 1;
        }
      }

      // Metadata facets
      for (const facetName of facetsToGenerate) {
        if (facetName !== 'type' && facetName !== 'tags' && entity.metadata[facetName]) {
          if (!facets[facetName]) facets[facetName] = {};
          const value = String(entity.metadata[facetName]);
          facets[facetName][value] = (facets[facetName][value] || 0) + 1;
        }
      }
    }

    // Convert to required format
    const result: Record<string, Array<{ value: string; count: number }>> = {};
    for (const [facetName, facetValues] of Object.entries(facets)) {
      result[facetName] = Object.entries(facetValues)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Limit to top 10 values
    }

    return result;
  }

  // Generate search suggestions
  private generateSuggestions(queryText: string): string[] {
    if (!queryText.trim()) return [];

    const suggestions = new Set<string>();
    const words = this.tokenize(queryText);
    const lastWord = words[words.length - 1];

    // Find words that start with the last word
    for (const indexWord of this.wordIndex.keys()) {
      if (indexWord.startsWith(lastWord) && indexWord !== lastWord) {
        const suggestion = words.slice(0, -1).concat(indexWord).join(' ');
        suggestions.add(suggestion);
      }
    }

    return Array.from(suggestions).slice(0, 5);
  }

  // Tokenize text into searchable words
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word));
  }

  // Check if word is a stop word
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'is', 'are', 'was', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can'
    ]);
    
    return stopWords.has(word);
  }

  // Refresh search index
  async refreshIndex(): Promise<void> {
    this.searchIndex.clear();
    this.wordIndex.clear();
    this.facetIndex.clear();
    
    await this.initializeSearchIndex();
    
    // Clear search cache
    await cache.invalidateByTags(['search']);
  }

  // Get search statistics
  getSearchStats(): {
    documentsIndexed: number;
    wordsIndexed: number;
    facetsIndexed: number;
    lastIndexed: Date;
  } {
    return {
      documentsIndexed: this.searchIndex.size,
      wordsIndexed: this.wordIndex.size,
      facetsIndexed: this.facetIndex.size,
      lastIndexed: new Date()
    };
  }
}

// Export singleton instance
export const searchEngine = new AdvancedSearchEngine();

// Search API helper functions
export const SearchHelpers = {
  // Quick search across all entities
  async quickSearch(query: string, limit: number = 10): Promise<SearchableEntity[]> {
    const result = await searchEngine.search({
      query,
      limit,
      sortBy: 'relevance'
    });
    
    return result.items;
  },

  // Search specific entity type
  async searchByType(
    query: string, 
    entityType: 'exercise' | 'system' | 'equipment' | 'user',
    options: { limit?: number; filters?: Record<string, any> } = {}
  ): Promise<SearchResult> {
    return searchEngine.search({
      query,
      entityTypes: [entityType],
      limit: options.limit || 20,
      filters: options.filters
    });
  },

  // Advanced search with filters and facets
  async advancedSearch(searchQuery: SearchQuery): Promise<SearchResult> {
    return searchEngine.search(searchQuery);
  },

  // Get search suggestions
  async getSuggestions(query: string): Promise<string[]> {
    const result = await searchEngine.search({
      query,
      limit: 0 // We only want suggestions
    });
    
    return result.suggestions;
  },

  // Get available facets for a search
  async getFacets(query?: string): Promise<Record<string, Array<{ value: string; count: number }>>> {
    const result = await searchEngine.search({
      query: query || '',
      limit: 0,
      facets: ['type', 'status', 'tags', 'role', 'location']
    });
    
    return result.facets;
  }
};

// Auto-refresh search index on data changes
export function scheduleIndexRefresh(): void {
  // Refresh index every hour
  setInterval(async () => {
    try {
      console.log('Refreshing search index...');
      await searchEngine.refreshIndex();
      console.log('Search index refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh search index:', error);
    }
  }, 60 * 60 * 1000); // 1 hour
}

// Initialize search engine on startup
if (typeof window === 'undefined') {
  // Server-side initialization
  searchEngine.initializeSearchIndex().then(() => {
    scheduleIndexRefresh();
  });
} 