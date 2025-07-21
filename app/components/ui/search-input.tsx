'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Checkbox } from './checkbox';
import { Label } from './label';
import { cn } from '@/app/lib/utils';

interface FilterOption {
  id: string;
  label: string;
  value: string;
  count?: number;
}

interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  multiple?: boolean;
}

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onFiltersChange?: (filters: Record<string, string[]>) => void;
  filterGroups?: FilterGroup[];
  className?: string;
  debounceMs?: number;
}

export function SearchInput({
  placeholder = "Search...",
  value,
  onChange,
  onFiltersChange,
  filterGroups = [],
  className,
  debounceMs = 300
}: SearchInputProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback((newValue: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);

    setSearchTimeout(timeout);
  }, [onChange, debounceMs, searchTimeout]);

  const handleFilterChange = useCallback((groupId: string, optionId: string, checked: boolean) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      if (!newFilters[groupId]) {
        newFilters[groupId] = [];
      }

      if (checked) {
        newFilters[groupId] = [...newFilters[groupId], optionId];
      } else {
        newFilters[groupId] = newFilters[groupId].filter(id => id !== optionId);
      }

      if (newFilters[groupId].length === 0) {
        delete newFilters[groupId];
      }

      onFiltersChange?.(newFilters);
      return newFilters;
    });
  }, [onFiltersChange]);

  const clearFilters = useCallback(() => {
    setActiveFilters({});
    onFiltersChange?.({});
  }, [onFiltersChange]);

  const activeFilterCount = useMemo(() => {
    return Object.values(activeFilters).reduce((count, filters) => count + filters.length, 0);
  }, [activeFilters]);

  return (
    <div className={cn('relative', className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={placeholder}
            defaultValue={value}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>
        
        {filterGroups.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'relative',
              activeFilterCount > 0 && 'border-blue-500 text-blue-600'
            )}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={cn(
              'h-4 w-4 ml-2 transition-transform',
              showFilters && 'rotate-180'
            )} />
          </Button>
        )}
      </div>

      {showFilters && filterGroups.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Filters</h3>
              <div className="flex gap-2">
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                  >
                    Clear All
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterGroups.map(group => (
                <div key={group.id} className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-700">
                    {group.label}
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {group.options.map(option => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${group.id}-${option.id}`}
                          checked={activeFilters[group.id]?.includes(option.id) || false}
                          onCheckedChange={(checked) => 
                            handleFilterChange(group.id, option.id, checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={`${group.id}-${option.id}`}
                          className="text-sm flex-1 cursor-pointer"
                        >
                          {option.label}
                          {option.count !== undefined && (
                            <span className="text-gray-400 ml-1">({option.count})</span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function QuickFilters({ 
  filters, 
  activeFilters, 
  onFilterToggle 
}: {
  filters: FilterOption[];
  activeFilters: string[];
  onFilterToggle: (filterId: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(filter => (
        <Button
          key={filter.id}
          variant={activeFilters.includes(filter.id) ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterToggle(filter.id)}
          className="text-xs"
        >
          {filter.label}
          {filter.count !== undefined && (
            <span className="ml-1">({filter.count})</span>
          )}
        </Button>
      ))}
    </div>
  );
} 