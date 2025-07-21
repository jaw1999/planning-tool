'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Equipment } from '@/app/lib/types/equipment';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { SearchInput } from '@/app/components/ui/search-input';
import { LoadingSpinner, LoadingCard } from '../ui/loading-spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Plus, Eye, Edit, Trash2, Download, Grid, List, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/app/lib/utils/format';

interface EnhancedEquipmentListProps {
  onEquipmentSelect?: (equipment: Equipment) => void;
  selectable?: boolean;
  compact?: boolean;
}

const statusColors = {
  AVAILABLE: 'bg-green-100 text-green-800',
  IN_USE: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  RETIRED: 'bg-gray-100 text-gray-800',
};

const classificationColors = {
  UNCLASSIFIED: 'bg-gray-100 text-gray-800',
  'UNCLASSIFIED//FOUO': 'bg-yellow-100 text-yellow-800',
  CONFIDENTIAL: 'bg-orange-100 text-orange-800',
  SECRET: 'bg-red-100 text-red-800',
  'TOP SECRET': 'bg-purple-100 text-purple-800',
};

const filterGroups = [
  {
    id: 'status',
    label: 'Status',
    options: [
      { id: 'AVAILABLE', label: 'Available', value: 'AVAILABLE' },
      { id: 'IN_USE', label: 'In Use', value: 'IN_USE' },
      { id: 'MAINTENANCE', label: 'Maintenance', value: 'MAINTENANCE' },
      { id: 'RETIRED', label: 'Retired', value: 'RETIRED' },
    ]
  },
  {
    id: 'classification',
    label: 'Classification',
    options: [
      { id: 'UNCLASSIFIED', label: 'Unclassified', value: 'UNCLASSIFIED' },
      { id: 'CONFIDENTIAL', label: 'Confidential', value: 'CONFIDENTIAL' },
      { id: 'SECRET', label: 'Secret', value: 'SECRET' },
      { id: 'TOP_SECRET', label: 'Top Secret', value: 'TOP SECRET' },
    ]
  },
  {
    id: 'fsrFrequency',
    label: 'FSR Support',
    options: [
      { id: 'AS_NEEDED', label: 'As Needed', value: 'AS_NEEDED' },
      { id: 'WEEKLY', label: 'Weekly', value: 'WEEKLY' },
      { id: 'MONTHLY', label: 'Monthly', value: 'MONTHLY' },
      { id: 'QUARTERLY', label: 'Quarterly', value: 'QUARTERLY' },
    ]
  },
];

export function EnhancedEquipmentList({ 
  onEquipmentSelect, 
  selectable = false, 
  compact = false 
}: EnhancedEquipmentListProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/equipment');
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedEquipment = useMemo(() => {
    let filtered = equipment.filter(item => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          item.productInfo?.name?.toLowerCase().includes(searchLower) ||
          item.productInfo?.model?.toLowerCase().includes(searchLower) ||
          item.productInfo?.description?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Active filters
      for (const [filterType, filterValues] of Object.entries(activeFilters)) {
        if (filterValues.length === 0) continue;
        
        let itemValue: string;
        switch (filterType) {
          case 'status':
            itemValue = item.status || '';
            break;
          case 'classification':
            itemValue = item.productInfo?.classification || '';
            break;
          case 'fsrFrequency':
            itemValue = item.fsrFrequency || '';
            break;
          default:
            continue;
        }
        
        if (!filterValues.includes(itemValue)) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'name':
          aVal = a.productInfo?.name || '';
          bVal = b.productInfo?.name || '';
          break;
        case 'cost':
          aVal = a.acquisitionCost || 0;
          bVal = b.acquisitionCost || 0;
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        case 'updated':
          aVal = new Date(a.updatedAt || 0);
          bVal = new Date(b.updatedAt || 0);
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [equipment, searchTerm, activeFilters, sortBy, sortOrder]);

  const handleItemSelect = useCallback((item: Equipment) => {
    if (selectable) {
      onEquipmentSelect?.(item);
    } else {
      router.push(`/equipment/${item.id}`);
    }
  }, [selectable, onEquipmentSelect, router]);

  const handleBulkAction = useCallback((action: string) => {
    console.log(`Bulk action: ${action} on items:`, Array.from(selectedItems));
    // Implement bulk actions
  }, [selectedItems]);

  if (loading) {
    return <LoadingCard>Loading equipment...</LoadingCard>;
  }

  const EquipmentCard = ({ item }: { item: Equipment }) => (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedItems.has(item.id) ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => handleItemSelect(item)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">
              {item.productInfo?.name || 'Unnamed Equipment'}
            </CardTitle>
            <p className="text-sm text-gray-600 truncate">
              {item.productInfo?.model}
            </p>
          </div>
          {selectable && (
            <input
              type="checkbox"
              checked={selectedItems.has(item.id)}
              onChange={(e) => {
                e.stopPropagation();
                const newSelected = new Set(selectedItems);
                if (e.target.checked) {
                  newSelected.add(item.id);
                } else {
                  newSelected.delete(item.id);
                }
                setSelectedItems(newSelected);
              }}
              className="ml-2"
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge className={statusColors[item.status || 'AVAILABLE']}>
              {item.status || 'Available'}
            </Badge>
            {item.productInfo?.classification && (
              <Badge className={classificationColors[item.productInfo.classification]}>
                {item.productInfo.classification}
              </Badge>
            )}
          </div>
          
          {item.productInfo?.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {item.productInfo.description}
            </p>
          )}
          
          <div className="flex justify-between items-center text-sm">
            {item.acquisitionCost && (
              <span className="font-medium">
                {formatCurrency(item.acquisitionCost)}
              </span>
            )}
            <span className="text-gray-500">
              FSR: {item.fsrFrequency || 'As Needed'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EquipmentRow = ({ item }: { item: Equipment }) => (
    <tr 
      className={`cursor-pointer hover:bg-gray-50 ${
        selectedItems.has(item.id) ? 'bg-blue-50' : ''
      }`}
      onClick={() => handleItemSelect(item)}
    >
      {selectable && (
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={selectedItems.has(item.id)}
            onChange={(e) => {
              e.stopPropagation();
              const newSelected = new Set(selectedItems);
              if (e.target.checked) {
                newSelected.add(item.id);
              } else {
                newSelected.delete(item.id);
              }
              setSelectedItems(newSelected);
            }}
          />
        </td>
      )}
      <td className="px-4 py-3">
        <div>
          <div className="font-medium">{item.productInfo?.name || 'Unnamed'}</div>
          <div className="text-sm text-gray-600">{item.productInfo?.model}</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge className={statusColors[item.status || 'AVAILABLE']}>
          {item.status || 'Available'}
        </Badge>
      </td>
      <td className="px-4 py-3">
        {item.productInfo?.classification && (
          <Badge className={classificationColors[item.productInfo.classification]}>
            {item.productInfo.classification}
          </Badge>
        )}
      </td>
      <td className="px-4 py-3">
        {item.acquisitionCost ? formatCurrency(item.acquisitionCost) : '-'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {item.fsrFrequency || 'As Needed'}
      </td>
    </tr>
  );

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={setSearchTerm}
            onFiltersChange={setActiveFilters}
            filterGroups={filterGroups}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="cost">Cost</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="updated">Updated</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
          
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectable && selectedItems.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedItems.size} item(s) selected
          </span>
          <Button size="sm" onClick={() => handleBulkAction('compare')}>
            Compare
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkAction('export')}>
            Export
          </Button>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredAndSortedEquipment.length} of {equipment.length} items
      </div>

      {/* Equipment Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedEquipment.map(item => (
            <EquipmentCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {selectable && <th className="px-4 py-3 text-left w-12"></th>}
                <th className="px-4 py-3 text-left">Equipment</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Classification</th>
                <th className="px-4 py-3 text-left">Cost</th>
                <th className="px-4 py-3 text-left">FSR Support</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedEquipment.map(item => (
                <EquipmentRow key={item.id} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No Results */}
      {filteredAndSortedEquipment.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No equipment found matching your criteria</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setSearchTerm('');
              setActiveFilters({});
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
} 