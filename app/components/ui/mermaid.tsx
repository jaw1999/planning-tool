'use client';

import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
  chart: string;
}

export default function Mermaid({ chart }: MermaidProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      securityLevel: 'loose',
      er: {
        useMaxWidth: true,
        layoutDirection: 'TB',
        entityPadding: 30,
        fontSize: 14
      }
    });

    const renderDiagram = async () => {
      if (elementRef.current) {
        elementRef.current.innerHTML = '';
        try {
          const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
          const { svg } = await mermaid.render(id, chart);
          elementRef.current.innerHTML = svg;
        } catch (error) {
          console.error('Error rendering mermaid chart:', error);
          elementRef.current.innerHTML = '<p class="text-red-500">Failed to render diagram</p>';
        }
      }
    };

    renderDiagram();
  }, [chart]);

  return (
    <div 
      ref={elementRef}
      className="w-full overflow-x-auto bg-background p-4"
    />
  );
} 