import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Package } from "lucide-react";

export function LogisticsSection({ logistics }: { logistics: any }) {
  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.map(item => `• ${item}`).join('\n');
    }
    
    if (typeof value === 'object' && value !== null) {
      if ('price' in value && 'quantity' in value) {
        return `$${value.price.toLocaleString()} (${value.quantity})`;
      }
      return Object.entries(value || {})
        .map(([k, v]) => {
          const cleanKey = k
            .replace(/([A-Z])/g, ' $1')
            .toLowerCase()
            .trim();
          return `• ${cleanKey}: ${formatValue(v)}`;
        })
        .join('\n');
    }
    
    return String(value);
  };

  return (
    <Card className="bg-slate-800 text-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Package className="h-4 w-4" />
          Logistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm space-y-2">
          {Object.entries(logistics).map(([section, data]) => {
            if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
              return null;
            }
            
            return (
              <div key={section} className="space-y-1">
                <div className="font-medium capitalize">
                  {section}
                </div>
                <div className="text-slate-400 whitespace-pre-line pl-4">
                  {Object.entries(data || {}).map(([key, value]) => {
                    if (!value || (Array.isArray(value) && !value.length)) return null;
                    
                    return (
                      <div key={key}>
                        • {key}: {formatValue(value)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 