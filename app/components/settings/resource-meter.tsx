interface ResourceMeterProps {
  title: string;
  value: number;
  max: number;
  unit: string;
}

export function ResourceMeter({ title, value, max, unit }: ResourceMeterProps) {
  const percentage = (value / max) * 100;
  const getColor = (pct: number) => {
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        <span className="text-sm font-medium">
          {value} {unit}
        </span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(percentage)} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
} 