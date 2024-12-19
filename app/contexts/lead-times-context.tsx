'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type LeadTimeType = 'PROCUREMENT' | 'LOGISTICS' | 'TRAINING' | 'SETUP' | 'OTHER';

export interface LeadTimeItem {
  id: string;
  name: string;
  description: string;
  daysInAdvance: number;
  type: LeadTimeType;
}

interface LeadTimesContextType {
  leadTimes: LeadTimeItem[];
  addLeadTime: (leadTime: Omit<LeadTimeItem, 'id'>) => void;
  updateLeadTime: (id: string, leadTime: Partial<LeadTimeItem>) => void;
  deleteLeadTime: (id: string) => void;
}

const LeadTimesContext = createContext<LeadTimesContextType | null>(null);

export function LeadTimesProvider({ children }: { children: React.ReactNode }) {
  const [leadTimes, setLeadTimes] = useState<LeadTimeItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('leadTimes');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('leadTimes', JSON.stringify(leadTimes));
  }, [leadTimes]);

  const addLeadTime = (leadTime: Omit<LeadTimeItem, 'id'>) => {
    setLeadTimes(prev => [...prev, { ...leadTime, id: crypto.randomUUID() }]);
  };

  const updateLeadTime = (id: string, updates: Partial<LeadTimeItem>) => {
    setLeadTimes(prev => 
      prev.map(lt => lt.id === id ? { ...lt, ...updates } : lt)
    );
  };

  const deleteLeadTime = (id: string) => {
    setLeadTimes(prev => prev.filter(lt => lt.id !== id));
  };

  return (
    <LeadTimesContext.Provider value={{ leadTimes, addLeadTime, updateLeadTime, deleteLeadTime }}>
      {children}
    </LeadTimesContext.Provider>
  );
}

export const useLeadTimes = () => {
  const context = useContext(LeadTimesContext);
  if (!context) throw new Error('useLeadTimes must be used within a LeadTimesProvider');
  return context;
}; 