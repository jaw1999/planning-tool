'use client';

import { useState } from 'react';
import { useEquipment } from '@/app/hooks/use-equipment';
import { Equipment } from '@/app/lib/types/equipment';
import { Card, CardHeader, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { ChevronDown, ChevronUp, Ruler, Cpu, Zap, DollarSign, Cable, Thermometer, Code, Settings, Truck, Radio, Settings2, Waves, Filter, Cloud } from 'lucide-react';
import { Checkbox } from '@/app/components/ui/checkbox';

interface SpecItem {
  label: string;
  value: any;
  path?: string[];
}

interface SpecListProps {
  items: SpecItem[];
}

interface SearchFilters {
  status: string[];
  type: string[];
  classification: string[];
  priceRange: {
    min: number | null;
    max: number | null;
  };
  rfCapabilities: string[];
  software: string[];
  environmentalCerts: string[];
  deploymentMethods: string[];
  location: string[];
  fsrFrequency: string[];
  frequencyRange: {
    min: number | null;
    max: number | null;
  };
  selectedBands: string[];
}

const SEARCH_HELP = {
  operators: [
    { operator: 'type:', example: 'type:rf status:available price:1000-5000', description: 'Search by equipment type, status, and price range' },
    { operator: 'model:', example: 'model:x1000', description: 'Search by model number' },
    { operator: 'price:', example: 'price:1000-5000', description: 'Search by price range' }
  ]
};

interface FilterOption {
  label: string;
  value: string;
}

const STATUS_OPTIONS: FilterOption[] = [
  { label: 'Available', value: 'AVAILABLE' },
  { label: 'In Use', value: 'IN_USE' },
  { label: 'Maintenance', value: 'MAINTENANCE' },
  { label: 'Retired', value: 'RETIRED' }
];

const TYPE_OPTIONS: FilterOption[] = [
  { label: 'RF Equipment', value: 'RF' },
  { label: 'Balloon', value: 'BALLOON' },
  { label: 'UAS', value: 'UAS' },
  { label: 'Communications', value: 'COMMUNICATIONS' },
  { label: 'Support', value: 'SUPPORT' }
];

const CLASSIFICATION_OPTIONS: FilterOption[] = [
  { label: 'Unclassified', value: 'UNCLASSIFIED' },
  { label: 'Confidential', value: 'CONFIDENTIAL' },
  { label: 'Secret', value: 'SECRET' },
  { label: 'Top Secret', value: 'TOP_SECRET' }
];

const RF_CAPABILITIES = [
  'Signal Processing',
  'Frequency Analysis',
  'Direction Finding',
  'Spectrum Monitoring',
  'Geolocation',
  'TDOA',
  'AOA'
];

const SOFTWARE_FEATURES = [
  'Real-time Analysis',
  'Post-mission Analysis',
  'Mission Planning',
  'Automated Control',
  'Remote Operation',
  'Data Export'
];

const DEPLOYMENT_METHODS = [
  'Fixed Installation',
  'Mobile',
  'Man-Portable',
  'Vehicle-Mounted',
  'Airborne',
  'Maritime'
];

const FREQUENCY_BANDS: Record<string, { label: string; min: number; max: number; aliases: string[] }> = {
  'HF': { label: 'HF', min: 3, max: 30, aliases: ['hf', 'high frequency', 'h-f'] },
  'VHF': { label: 'VHF', min: 30, max: 300, aliases: ['vhf', 'very high frequency', 'v-h-f'] },
  'UHF': { label: 'UHF', min: 300, max: 3000, aliases: ['uhf', 'ultra high frequency', 'u-h-f'] },
  'L': { label: 'L-Band', min: 1000, max: 2000, aliases: ['l band', 'l-band', 'lband'] },
  'S': { label: 'S-Band', min: 2000, max: 4000, aliases: ['s band', 's-band', 'sband'] },
  'C': { label: 'C-Band', min: 4000, max: 8000, aliases: ['c band', 'c-band', 'cband'] },
  'X': { label: 'X-Band', min: 8000, max: 12000, aliases: ['x band', 'x-band', 'xband'] },
  'Ku': { label: 'Ku-Band', min: 12000, max: 18000, aliases: ['ku band', 'ku-band', 'kuband'] },
  'K': { label: 'K-Band', min: 18000, max: 27000, aliases: ['k band', 'k-band', 'kband'] },
  'Ka': { label: 'Ka-Band', min: 27000, max: 40000, aliases: ['ka band', 'ka-band', 'kaband'] },
  'GSM': { label: 'GSM', min: 880, max: 960, aliases: ['gsm', 'gsm-r', 'cellular'] },
  'UMTS': { label: 'UMTS', min: 1920, max: 2170, aliases: ['umts', '3g', 'wcdma'] },
  'LTE': { label: 'LTE', min: 700, max: 2600, aliases: ['lte', '4g', 'long term evolution'] },
  'WIFI': { label: 'WiFi', min: 2400, max: 5800, aliases: ['wifi', 'wi-fi', '802.11', 'wlan'] },
  'DMR': { label: 'DMR', min: 136, max: 174, aliases: ['dmr', 'digital mobile radio'] }
};

// Update the parseFrequency function to convert everything to MHz
const parseFrequency = (freq: string): number => {
  const value = parseFloat(freq);
  if (freq.toLowerCase().includes('ghz')) return value * 1000;
  if (freq.toLowerCase().includes('mhz')) return value;
  if (freq.toLowerCase().includes('khz')) return value / 1000;
  if (freq.toLowerCase().includes('hz')) return value / 1000000;
  return value; // Assume MHz if no unit specified
};

export function EquipmentList() {
  const { equipment, isLoading, error } = useEquipment();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    status: [],
    type: [],
    classification: [],
    priceRange: { min: null, max: null },
    rfCapabilities: [],
    software: [],
    environmentalCerts: [],
    deploymentMethods: [],
    location: [],
    fsrFrequency: [],
    frequencyRange: { min: null, max: null },
    selectedBands: []
  });
  const [showFilters, setShowFilters] = useState(false);

  const parseSearchTerm = (term: string) => {
    const terms = term.toLowerCase().split(' ');
    return terms.reduce((acc, term) => {
      if (term.includes(':')) {
        const [key, value] = term.split(':');
        acc.specific[key] = value;
      } else {
        acc.general.push(term);
      }
      return acc;
    }, { general: [] as string[], specific: {} as Record<string, string> });
  };

  const filteredEquipment = equipment.filter(item => {
    // Basic search term filtering
    const { general, specific } = parseSearchTerm(searchTerm);
    
    const matchesGeneral = searchTerm === '' || general.some(term =>
      JSON.stringify(item).toLowerCase().includes(term.toLowerCase())
    );

    // Check specific field searches
    const matchesSpecific = Object.entries(specific).every(([key, value]) => {
      switch (key) {
        case 'status':
          return JSON.stringify(item).toLowerCase().includes(value.toLowerCase());
        case 'type':
          return JSON.stringify(item).toLowerCase().includes(value.toLowerCase());
        case 'model':
          return JSON.stringify(item).toLowerCase().includes(value.toLowerCase());
        case 'price':
          const price = Number(item.acquisitionCost) || 0;
          const [min, max] = value.split('-').map(Number);
          return price >= min && (!max || price <= max);
        default:
          return true;
      }
    });

    // Filter logic - start with true and only apply active filters
    let shouldInclude = true;

    // Status filter
    if (filters.status.length > 0) {
      shouldInclude = filters.status.some(status =>
        JSON.stringify(item).toLowerCase().includes(status.toLowerCase())
      );
      if (!shouldInclude) return false;
    }

    // Type filter with special handling for BALLOON
    if (filters.type.length > 0) {
      shouldInclude = filters.type.some(type => {
        if (type === 'BALLOON') {
          const itemStr = JSON.stringify(item).toLowerCase();
          return itemStr.includes('balloon') || 
                 itemStr.includes('microballoon') || 
                 itemStr.includes('hab');
        }
        return JSON.stringify(item).toLowerCase().includes(type.toLowerCase());
      });
      if (!shouldInclude) return false;
    }

    // Classification filter
    if (filters.classification.length > 0) {
      shouldInclude = filters.classification.some(classification =>
        JSON.stringify(item).toLowerCase().includes(classification.toLowerCase())
      );
      if (!shouldInclude) return false;
    }

    // Price range filter (keep as is since it's numeric)
    if (filters.priceRange.min !== null || filters.priceRange.max !== null) {
      const price = Number(item.acquisitionCost) || 0;
      if (filters.priceRange.min !== null && price < filters.priceRange.min) return false;
      if (filters.priceRange.max !== null && price > filters.priceRange.max) return false;
    }

    // Other capability filters
    const checkFilter = (filterArray: string[]) => {
      if (filterArray.length === 0) return true;
      return filterArray.some(value =>
        JSON.stringify(item).toLowerCase().includes(value.toLowerCase())
      );
    };

    const checkFrequencyRange = (item: Equipment): boolean => {
      // Check selected bands if any are selected
      if (filters.selectedBands.length > 0) {
        const itemStr = JSON.stringify(item).toLowerCase();
        const itemBands = item.systemComponents?.rfSpecifications?.frequencies?.bands || [];
        
        // Check if any selected band matches
        const matchesBand = filters.selectedBands.some(selectedBand => {
          const bandInfo = FREQUENCY_BANDS[selectedBand];
          if (!bandInfo) return false;

          // Check for text matches including aliases
          if (bandInfo.aliases?.some(alias => itemStr.includes(alias.toLowerCase()))) {
            return true;
          }

          // Check explicit bands list (case-insensitive)
          if (itemBands.some(band => 
            band.toLowerCase() === selectedBand.toLowerCase() ||
            bandInfo.aliases?.some(alias => band.toLowerCase() === alias.toLowerCase())
          )) {
            return true;
          }

          // Check frequency ranges against band ranges
          const ranges = [
            ...(item.systemComponents?.rfSpecifications?.frequencies?.ranges || []),
            ...(item.systemComponents?.rfSpecifications?.ewCapabilities?.frequencyCoverage?.detection || [])
          ];

          return ranges.some(range => {
            // Validate range format
            if (!range.includes('-')) return false;
            
            const [minStr, maxStr] = range.split('-');
            const rangeMin = parseFrequency(minStr);
            const rangeMax = parseFrequency(maxStr);
            
            if (isNaN(rangeMin) || isNaN(rangeMax)) return false;
            
            // Check for overlap
            return (rangeMin <= bandInfo.max && rangeMax >= bandInfo.min);
          });
        });

        if (!matchesBand) return false;
      }

      // Check frequency range if min or max is set
      if (filters.frequencyRange.min !== null || filters.frequencyRange.max !== null) {
        const queryMin = filters.frequencyRange.min || 0;
        const queryMax = filters.frequencyRange.max || Infinity;

        // Helper function to check range overlap
        const hasOverlap = (range: string): boolean => {
          if (!range.includes('-')) return false;
          
          const [minStr, maxStr] = range.split('-');
          const rangeMin = parseFrequency(minStr);
          const rangeMax = parseFrequency(maxStr);
          
          if (isNaN(rangeMin) || isNaN(rangeMax)) return false;
          
          return (rangeMin <= queryMax && rangeMax >= queryMin);
        };

        // Check explicit frequency ranges
        const ranges = item.systemComponents?.rfSpecifications?.frequencies?.ranges || [];
        if (ranges.some(hasOverlap)) return true;

        // Check detection coverage ranges
        const detectionRanges = 
          item.systemComponents?.rfSpecifications?.ewCapabilities?.frequencyCoverage?.detection || [];
        if (detectionRanges.some(hasOverlap)) return true;

        // Check if any bands overlap with the query range
        const itemBands = item.systemComponents?.rfSpecifications?.frequencies?.bands || [];
        if (itemBands.some(band => {
          const bandRange = FREQUENCY_BANDS[band];
          return bandRange && (bandRange.min <= queryMax && bandRange.max >= queryMin);
        })) return true;

        return false;
      }

      return true;
    };

    return matchesGeneral && 
           matchesSpecific && 
           checkFilter(filters.rfCapabilities) &&
           checkFilter(filters.software) &&
           checkFilter(filters.deploymentMethods) &&
           checkFrequencyRange(item);
  });

  if (isLoading) return <div>Loading equipment data...</div>;
  if (error) return <div>Error loading equipment: {error}</div>;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const isRFEquipment = (item: any) => {
    const productType = item?.productInfo?.type?.toLowerCase();
    return productType !== 'microhab';
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search equipment... (try: type:rf status:available price:1000-5000)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Basic Information</h3>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Status</h4>
                  <div className="space-y-2">
                    {STATUS_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.status.includes(option.value)}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              status: checked 
                                ? [...prev.status, option.value]
                                : prev.status.filter(s => s !== option.value)
                            }));
                          }}
                        />
                        <label className="text-sm">{option.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Type</h4>
                  <div className="space-y-2">
                    {TYPE_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.type.includes(option.value)}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              type: checked 
                                ? [...prev.type, option.value]
                                : prev.type.filter(t => t !== option.value)
                            }));
                          }}
                        />
                        <label className="text-sm">{option.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Classification</h4>
                  <div className="space-y-2">
                    {CLASSIFICATION_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.classification.includes(option.value)}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              classification: checked 
                                ? [...prev.classification, option.value]
                                : prev.classification.filter(c => c !== option.value)
                            }));
                          }}
                        />
                        <label className="text-sm">{option.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Technical Capabilities */}
              <div className="space-y-4">
                <h3 className="font-semibold">Technical Capabilities</h3>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">RF Capabilities</h4>
                  <div className="space-y-2">
                    {RF_CAPABILITIES.map((capability) => (
                      <div key={capability} className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.rfCapabilities.includes(capability)}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              rfCapabilities: checked 
                                ? [...prev.rfCapabilities, capability]
                                : prev.rfCapabilities.filter(c => c !== capability)
                            }));
                          }}
                        />
                        <label className="text-sm">{capability}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Software Features</h4>
                  <div className="space-y-2">
                    {SOFTWARE_FEATURES.map((feature) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.software.includes(feature)}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              software: checked 
                                ? [...prev.software, feature]
                                : prev.software.filter(f => f !== feature)
                            }));
                          }}
                        />
                        <label className="text-sm">{feature}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Operational & Cost */}
              <div className="space-y-4">
                <h3 className="font-semibold">Operational & Cost</h3>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Price Range</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-sm">Min ($)</label>
                      <Input
                        type="number"
                        value={filters.priceRange.min || ''}
                        onChange={(e) => {
                          setFilters(prev => ({
                            ...prev,
                            priceRange: {
                              ...prev.priceRange,
                              min: e.target.value ? Number(e.target.value) : null
                            }
                          }));
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm">Max ($)</label>
                      <Input
                        type="number"
                        value={filters.priceRange.max || ''}
                        onChange={(e) => {
                          setFilters(prev => ({
                            ...prev,
                            priceRange: {
                              ...prev.priceRange,
                              max: e.target.value ? Number(e.target.value) : null
                            }
                          }));
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Deployment Methods</h4>
                  <div className="space-y-2">
                    {DEPLOYMENT_METHODS.map((method) => (
                      <div key={method} className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.deploymentMethods.includes(method)}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              deploymentMethods: checked 
                                ? [...prev.deploymentMethods, method]
                                : prev.deploymentMethods.filter(m => m !== method)
                            }));
                          }}
                        />
                        <label className="text-sm">{method}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Frequency Range (MHz)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-sm">Min</label>
                      <Input
                        type="number"
                        value={filters.frequencyRange.min || ''}
                        onChange={(e) => {
                          setFilters(prev => ({
                            ...prev,
                            frequencyRange: {
                              ...prev.frequencyRange,
                              min: e.target.value ? Number(e.target.value) : null
                            }
                          }));
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm">Max</label>
                      <Input
                        type="number"
                        value={filters.frequencyRange.max || ''}
                        onChange={(e) => {
                          setFilters(prev => ({
                            ...prev,
                            frequencyRange: {
                              ...prev.frequencyRange,
                              max: e.target.value ? Number(e.target.value) : null
                            }
                          }));
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Frequency Bands</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(FREQUENCY_BANDS).map(([band, info]) => (
                      <div key={band} className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.selectedBands.includes(band)}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              selectedBands: checked 
                                ? [...prev.selectedBands, band]
                                : prev.selectedBands.filter(b => b !== band)
                            }));
                          }}
                        />
                        <label className="text-sm">{info.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {filteredEquipment.map((item) => (
        <Card 
          key={item.id}
          className="cursor-pointer hover:bg-accent/5 transition-colors"
          onClick={() => toggleExpand(item.id)}
        >
          <CardHeader className="flex flex-row items-start justify-between p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{item.productInfo.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.productInfo.description}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge>{item.status}</Badge>
                  {item.productInfo.classification && (
                    <Badge variant="secondary">{item.productInfo.classification}</Badge>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">Model</h3>
                <p className="text-lg">{item.productInfo.model}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">Part Number</h3>
                <p className="text-lg">{item.productInfo.partNumber}</p>
              </div>
            </div>
            <div className="flex items-center">
              {expandedId === item.id ? (
                <ChevronUp className="h-6 w-6 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          </CardHeader>

          {expandedId === item.id && (
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <SpecSection 
                    title="Physical Specifications"
                    icon={<Ruler className="h-5 w-5" />}
                  >
                    <SpecList
                      items={[
                        { label: "Weight", value: item, path: ['physicalSpecifications', 'weight'] },
                        { label: "Dimensions", value: item, path: ['physicalSpecifications', 'dimensions'] },
                        { label: "Materials", value: item, path: ['physicalSpecifications', 'materials'] }
                      ]}
                    />
                  </SpecSection>

                  <SpecSection 
                    title="System Components"
                    icon={<Cpu className="h-5 w-5" />}
                  >
                    <SpecList
                      items={[
                        { label: "Primary Components", value: item, path: ['systemComponents', 'primary'] },
                        { label: "Secondary Components", value: item, path: ['systemComponents', 'secondary'] },
                        { label: "Communications", value: item, path: ['systemComponents', 'communications'] }
                      ]}
                    />
                  </SpecSection>

                  {isRFEquipment(item) && (
                    <>
                      <SpecSection 
                        title="RF Specifications"
                        icon={<Radio className="h-5 w-5" />}
                      >
                        <SpecList
                          items={[
                            { 
                              label: "Frequency Bands", 
                              value: item, 
                              path: ['systemComponents', 'rfSpecifications', 'frequencies', 'bands']
                            },
                            { 
                              label: "Frequency Ranges", 
                              value: item, 
                              path: ['systemComponents', 'rfSpecifications', 'frequencies', 'ranges']
                            },
                            { 
                              label: "Features",
                              value: item,
                              path: ['systemComponents', 'rfSpecifications', 'features']
                            },
                            { 
                              label: "Transmit Power",
                              value: item,
                              path: ['systemComponents', 'rfSpecifications', 'power', 'tx']
                            },
                            { 
                              label: "Receive Power",
                              value: item,
                              path: ['systemComponents', 'rfSpecifications', 'power', 'rx']
                            },
                            {
                              label: "Antenna Type",
                              value: item,
                              path: ['systemComponents', 'rfSpecifications', 'ewCapabilities', 'antenna', 'type']
                            },
                            {
                              label: "Antenna Gain",
                              value: item,
                              path: ['systemComponents', 'rfSpecifications', 'ewCapabilities', 'antenna', 'gain']
                            },
                            {
                              label: "Coverage Pattern",
                              value: item,
                              path: ['systemComponents', 'rfSpecifications', 'ewCapabilities', 'antenna', 'coverage']
                            }
                          ]}
                        />
                      </SpecSection>

                      <SpecSection 
                        title="RF Frequencies"
                        icon={<Waves className="h-5 w-5" />}
                      >
                        <SpecList
                          items={[
                            { label: "Frequency Ranges", value: item, path: ['systemComponents', 'rfSpecifications', 'frequencies', 'ranges'] },
                            { label: "Frequency Bands", value: item, path: ['systemComponents', 'rfSpecifications', 'frequencies', 'bands'] },
                            { label: "Detection Coverage", value: item, path: ['systemComponents', 'rfSpecifications', 'ewCapabilities', 'frequencyCoverage', 'detection'] }
                          ]}
                        />
                      </SpecSection>

                      <SpecSection 
                        title="RF Power & Sensitivity"
                        icon={<Zap className="h-5 w-5" />}
                      >
                        <SpecList
                          items={[
                            { label: "Transmit Power", value: item, path: ['systemComponents', 'rfSpecifications', 'power', 'tx'] },
                            { label: "Receive Power", value: item, path: ['systemComponents', 'rfSpecifications', 'power', 'rx'] },
                            { label: "Sensitivity Min", value: item, path: ['systemComponents', 'rfSpecifications', 'ewCapabilities', 'sensitivity', 'min'] },
                            { label: "Sensitivity Max", value: item, path: ['systemComponents', 'rfSpecifications', 'ewCapabilities', 'sensitivity', 'max'] }
                          ]}
                        />
                      </SpecSection>

                      <SpecSection 
                        title="RF Modes"
                        icon={<Settings2 className="h-5 w-5" />}
                      >
                        <SpecList
                          items={[
                            { label: "Operational Modes", value: item, path: ['systemComponents', 'rfSpecifications', 'ewCapabilities', 'operationalModes'] },
                            { label: "Processing Modes", value: item, path: ['systemComponents', 'rfSpecifications', 'ewCapabilities', 'signalProcessing', 'modes'] }
                          ]}
                        />
                      </SpecSection>
                    </>
                  )}

                  <SpecSection 
                    title="Power Specifications"
                    icon={<Zap className="h-5 w-5" />}
                  >
                    <SpecList
                      items={[
                        { label: "Input Requirements", value: item, path: ['powerSpecifications', 'input'] },
                        { label: "Power Consumption", value: item, path: ['powerSpecifications', 'consumption'] },
                        { label: "Power Management", value: item, path: ['powerSpecifications', 'management'] }
                      ]}
                    />
                  </SpecSection>

                  <SpecSection 
                    title="Cost & Support"
                    icon={<DollarSign className="h-5 w-5" />}
                  >
                    <SpecList
                      items={[
                        { 
                          label: "Base Cost", 
                          value: item.acquisitionCost ? `$${item.acquisitionCost.toLocaleString()}` : 'N/A'
                        },
                        { 
                          label: "FSR Support", 
                          value: item.fsrSupportCost ? 
                            `${item.fsrFrequency} - $${item.fsrSupportCost.toLocaleString()}/week` : 'N/A'
                        },
                        { 
                          label: "Support Staff", 
                          value: item.operations?.support?.staffing || 'N/A'
                        },
                        { 
                          label: "Specializations", 
                          value: item.operations?.support?.specializations?.join(", ") || 'N/A'
                        },
                        {
                          label: "Required Tools",
                          value: item.operations?.support?.tools?.join(", ") || 'N/A'
                        }
                      ].filter(item => item.value !== 'N/A')}
                    />
                  </SpecSection>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <SpecSection 
                    title="Interfaces"
                    icon={<Cable className="h-5 w-5" />}
                  >
                    <SpecList
                      items={[
                        { label: "Data", value: item, path: ['interfaces', 'data'] },
                        { label: "Electrical", value: item, path: ['interfaces', 'electrical'] },
                        { label: "Mechanical", value: item, path: ['interfaces', 'mechanical'] }
                      ]}
                    />
                  </SpecSection>

                  <SpecSection 
                    title="Environmental Specifications"
                    icon={<Cloud className="h-5 w-5" />}
                  >
                    <SpecList
                      items={[
                        { 
                          label: "Operating Temperature", 
                          value: item.environmentalSpecifications?.temperature?.operating || 'N/A'
                        },
                        { 
                          label: "Optimal Altitude", 
                          value: item.environmentalSpecifications?.operationalAltitude?.optimal || 
                                 item.environmentalSpecifications?.altitude?.operating || 'N/A'
                        },
                        { 
                          label: "Maximum Altitude", 
                          value: item.environmentalSpecifications?.operationalAltitude?.maximum || 
                                 item.environmentalSpecifications?.altitude?.maximum || 'N/A'
                        },
                        { 
                          label: "Extended Altitude", 
                          value: item.environmentalSpecifications?.operationalAltitude?.extended || 'N/A'
                        },
                        { 
                          label: "Wind Limitations", 
                          value: item.environmentalSpecifications?.operationalWindSpeed || 
                                 item.environmentalSpecifications?.weather?.wind || 'N/A'
                        },
                        { 
                          label: "Flight Duration", 
                          value: item.environmentalSpecifications?.flightDuration || 'N/A'
                        }
                      ].filter(item => item.value !== 'N/A')}
                    />
                  </SpecSection>

                  <SpecSection 
                    title="Software"
                    icon={<Code className="h-5 w-5" />}
                  >
                    <SpecList
                      items={[
                        { 
                          label: "Features", 
                          value: item.software?.features?.join(", ") || 'N/A'
                        },
                        { 
                          label: "GUI Capabilities", 
                          value: item.software?.gui?.capabilities?.join(", ") || 'N/A'
                        },
                        { 
                          label: "Control Interface", 
                          value: item.software?.control?.primary || 'N/A'
                        },
                        { 
                          label: "Control Features", 
                          value: item.software?.control?.features?.join(", ") || 'N/A'
                        },
                        { 
                          label: "Planning Tools", 
                          value: item.software?.planning?.tools?.join(", ") || 'N/A'
                        },
                        { 
                          label: "Planning Capabilities", 
                          value: item.software?.planning?.capabilities?.join(", ") || 'N/A'
                        },
                        { 
                          label: "Real-time Analysis", 
                          value: item.software?.analysis?.realtime?.join(", ") || 'N/A'
                        },
                        { 
                          label: "Post-mission Analysis", 
                          value: item.software?.analysis?.postMission?.join(", ") || 'N/A'
                        },
                        { 
                          label: "License Type", 
                          value: item.software?.licensing?.type || 'N/A'
                        }
                      ].filter(item => item.value !== 'N/A')}
                    />
                  </SpecSection>

                  <SpecSection 
                    title="Operations"
                    icon={<Settings className="h-5 w-5" />}
                  >
                    <SpecList
                      items={[
                        { label: "Deployment Methods", value: item, path: ['operations', 'deployment', 'methods'] },
                        { label: "Requirements", value: item, path: ['operations', 'deployment', 'requirements'] },
                        { label: "Limitations", value: item, path: ['operations', 'deployment', 'limitations'] },
                        { label: "Required Training", value: item, path: ['operations', 'training', 'required'] },
                        { label: "Optional Training", value: item, path: ['operations', 'training', 'optional'] },
                        { label: "Maintenance Schedule", value: item, path: ['operations', 'maintenance', 'scheduled'] }
                      ]}
                    />
                  </SpecSection>

                  <SpecSection 
                    title="Logistics & Refurbishment"
                    icon={<Truck className="h-5 w-5" />}
                  >
                    <SpecList
                      items={[
                        { label: "Lead Time", value: item, path: ['logistics', 'procurement', 'leadTime'] },
                        { label: "Refurbishment Cost", value: item, path: ['logistics', 'refurbishment', 'cost'] },
                        { label: "Refurbishment Time", value: item, path: ['logistics', 'refurbishment', 'time'] },
                        { label: "Refurbishment Options", value: item, path: ['logistics', 'refurbishment', 'options'] },
                        { label: "Refurbishment Requirements", value: item, path: ['logistics', 'refurbishment', 'requirements'] },
                        { label: "Required Spares", value: item, path: ['logistics', 'spares', 'required'] }
                      ]}
                    />
                  </SpecSection>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}

function SpecSection({ 
  title, 
  icon, 
  children 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function SpecList({ items }: SpecListProps) {
  const getNestedValue = (obj: any, path: string[]): any => {
    // Try direct path first
    let value = path.reduce((acc, key) => (acc ? acc[key] : undefined), obj);
    
    // If no value found, try alternative paths
    if (!value) {
      // Enhanced system components handling
      if (path.includes('systemComponents')) {
        // Only handle primary/secondary/communications if not looking for RF specs
        if (!path.includes('rfSpecifications')) {
          type ComponentTypes = 'primary' | 'secondary' | 'communications';
          const components: Record<ComponentTypes, any> = {
            primary: obj?.systemComponents?.primary || 
                     obj?.systemComponents?.mainUnit ||
                     obj?.systemComponents?.components,
            secondary: obj?.systemComponents?.secondary || 
                      obj?.systemComponents?.accessories,
            communications: obj?.systemComponents?.communications
          };

          // If we're looking for a specific component type, return only that
          const componentType = path[path.length - 1] as ComponentTypes;
          if (componentType in components) {
            return components[componentType];
          }
        }
        // Handle RF specifications separately
        else if (path.includes('rfSpecifications')) {
          return path.reduce((acc, key) => (acc ? acc[key] : undefined), obj);
        }
      }
      
      // Check for software in different locations
      if (path.includes('software')) {
        const softwareKey = path[path.length - 1];
        value = obj?.software?.[softwareKey] || 
                obj?.softwareComponents?.[softwareKey] ||
                obj?.software?.components?.[softwareKey];
      }
      
      // Check for pricing in different locations
      if (path.includes('cost') || path.includes('pricing')) {
        value = obj?.logistics?.refurbishment?.pricing || 
                obj?.logistics?.refurbishment?.cost ||
                obj?.refurbishmentCost;
      }
      
      // Check for lead times
      if (path.includes('leadTime')) {
        value = obj?.logistics?.procurement?.leadTime ||
                obj?.procurement?.leadTime ||
                obj?.leadTime;
      }

      // Check for refurbishment requirements
      if (path.includes('refurbishment') && path.includes('requirements')) {
        value = obj?.logistics?.refurbishment?.requirements ||
                obj?.refurbishment?.requirements ||
                obj?.refurbishmentRequirements;
      }
    }

    return value;
  };

  const formatValue = (value: any, itemPath?: string[]): string => {
    if (!value) return 'N/A';
    
    if (Array.isArray(value)) {
      return value.map(item => ` ${item}`).join('\n');
    }
    
    if (typeof value === 'object' && value !== null) {
      return Object.entries(value)
        .map(([key, val]) => {
          if (!val) return null;
          
          // Clean up the key name
          const cleanKey = key
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .toLowerCase()
            .trim();

          // Handle nested objects and arrays
          if (typeof val === 'object') {
            const nestedValue = formatValue(val);
            if (nestedValue === 'N/A') return null;
            return `${cleanKey}:\n${nestedValue.split('\n').map(line => `  ${line}`).join('\n')}`;
          }
          
          return `${cleanKey}: ${val}`;
        })
        .filter(Boolean)
        .join('\n');
    }
    
    // Handle currency values
    if (itemPath?.includes('cost') || itemPath?.includes('pricing')) {
      const num = parseFloat(String(value));
      if (!isNaN(num)) {
        return `$${num.toLocaleString()}`;
      }
    }
    
    return String(value)
      .replace(/["\[\]{}]/g, '')
      .trim();
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const value = item.path ? getNestedValue(item.value, item.path) : item.value;
        if (!value) return null;
        return (
          <div key={index} className="grid grid-cols-2 gap-4">
            <span className="text-sm font-medium text-muted-foreground">{item.label}:</span>
            <span className="text-sm whitespace-pre-wrap">
              {formatValue(value, item.path)}
            </span>
          </div>
        );
      })}
    </div>
  );
}