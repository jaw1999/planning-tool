interface ResourceMeterProps {
  label: string;
  value: number;
  max: number;
}

export function ResourceMeter({ label, value, max }: ResourceMeterProps) {
  const percentage = (value / max) * 100;
  const getColor = (pct: number) => {
    if (pct < 60) return 'bg-green-500';
    if (pct < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(percentage)} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
} 