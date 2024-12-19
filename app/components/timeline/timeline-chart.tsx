import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Exercise, ExerciseSystem, System } from '@/app/lib/types/system';
import { addDays, format, differenceInDays } from 'date-fns';
import { useLeadTimes, LeadTimeType } from '../../contexts/lead-times-context';

interface TimelineChartProps {
  exercise: Exercise & {
    systems: (ExerciseSystem & {
      system: System;
    })[];
  };
}

interface TimelineEvent {
  systemId: string;
  systemName: string;
  type: 'ORDER' | 'DELIVERY' | 'SETUP' | 'START' | 'END' | 'LEADTIME';
  date: Date;
  description: string;
  category?: LeadTimeType;
}

export function TimelineChart({ exercise }: TimelineChartProps) {
  const { leadTimes } = useLeadTimes();
  const events: TimelineEvent[] = [];
  const today = new Date();
  const exerciseStart = new Date(exercise.startDate);
  const exerciseEnd = new Date(exercise.endDate);

  // Add lead time events
  leadTimes.forEach((lt) => {
    const dueDate = addDays(exerciseStart, -lt.daysInAdvance);
    events.push({
      systemId: `leadtime-${lt.id}`,
      systemName: lt.name,
      type: 'LEADTIME',
      date: dueDate,
      description: lt.description,
      category: lt.type
    });
  });

  // Add exercise start and end events
  events.push({
    systemId: 'exercise',
    systemName: exercise.name,
    type: 'START',
    date: exerciseStart,
    description: 'Exercise Begins'
  });

  events.push({
    systemId: 'exercise',
    systemName: exercise.name,
    type: 'END',
    date: exerciseEnd,
    description: 'Exercise Ends'
  });

  // Add system-specific events
  exercise.systems.forEach(({ system }) => {
    // Calculate order date based on lead time
    const orderDate = addDays(exerciseStart, -system.leadTime);
    const deliveryDate = addDays(exerciseStart, -7); // Assume delivery 1 week before exercise

    events.push({
      systemId: system.id,
      systemName: system.name,
      type: 'ORDER',
      date: orderDate,
      description: `Order ${system.name}`
    });

    events.push({
      systemId: system.id,
      systemName: system.name,
      type: 'DELIVERY',
      date: deliveryDate,
      description: `${system.name} Delivery`
    });
  });

  // Sort events by date
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Find the earliest and latest dates for timeline bounds
  const earliestDate = events[0].date;
  const latestDate = events[events.length - 1].date;
  const totalDays = differenceInDays(latestDate, earliestDate) + 1;

  const getEventColor = (type: TimelineEvent['type'], category?: string) => {
    if (type === 'LEADTIME') {
      const categoryColors = {
        PROCUREMENT: 'bg-blue-500',
        LOGISTICS: 'bg-green-500',
        TRAINING: 'bg-yellow-500',
        SETUP: 'bg-purple-500',
        OTHER: 'bg-gray-500'
      };
      return categoryColors[category as keyof typeof categoryColors] || 'bg-gray-500';
    }
    const colors = {
      ORDER: 'bg-blue-500',
      DELIVERY: 'bg-green-500',
      SETUP: 'bg-yellow-500',
      START: 'bg-purple-500',
      END: 'bg-red-500'
    };
    return colors[type];
  };

  const getEventPosition = (date: Date) => {
    const position = (differenceInDays(date, earliestDate) / totalDays) * 100;
    return `${Math.max(0, Math.min(100, position))}%`;
  };

  const isEventPast = (date: Date) => {
    return date < today;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exercise Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Timeline header */}
          <div className="flex justify-between text-sm text-gray-600">
            <span>{format(earliestDate, 'MMM d, yyyy')}</span>
            <span>{format(latestDate, 'MMM d, yyyy')}</span>
          </div>

          {/* Timeline track */}
          <div className="relative h-2 bg-gray-200 rounded">
            <div 
              className="absolute h-full bg-blue-200 rounded"
              style={{
                left: getEventPosition(exerciseStart),
                width: `${(differenceInDays(exerciseEnd, exerciseStart) / totalDays) * 100}%`
              }}
            />
            {events.map((event, index) => (
              <div
                key={`${event.systemId}-${event.type}-${index}`}
                className={`absolute w-3 h-3 rounded-full -mt-0.5 ${getEventColor(event.type, event.category)} ${
                  isEventPast(event.date) ? 'opacity-50' : ''
                }`}
                style={{
                  left: getEventPosition(event.date),
                  transform: 'translateX(-50%)'
                }}
                title={`${event.description} - ${format(event.date, 'MMM d, yyyy')}`}
              />
            ))}
          </div>

          {/* Events list */}
          <div className="space-y-4">
            {events.map((event, index) => (
              <div
                key={`${event.systemId}-${event.type}-${index}`}
                className={`flex items-center space-x-4 ${
                  isEventPast(event.date) ? 'opacity-50' : ''
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${getEventColor(event.type, event.category)}`} />
                <div className="flex-1">
                  <div className="font-medium">{event.description}</div>
                  <div className="text-sm text-gray-600">
                    {format(event.date, 'MMM d, yyyy')}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {isEventPast(event.date) ? (
                    <span className="text-green-600">Completed</span>
                  ) : (
                    `In ${differenceInDays(event.date, today)} days`
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 pt-4 border-t">
            {[
              { type: 'ORDER', label: 'Order Date' },
              { type: 'DELIVERY', label: 'Delivery' },
              { type: 'SETUP', label: 'Setup' },
              { type: 'START', label: 'Start' },
              { type: 'END', label: 'End' }
            ].map(({ type, label }) => (
              <div key={type} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getEventColor(type as TimelineEvent['type'])}`} />
                <span className="text-sm text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}