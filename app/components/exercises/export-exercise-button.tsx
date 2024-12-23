import React from 'react';
import { Button } from "../ui/button";
import { Download } from "lucide-react";
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';
import { formatCurrency } from "@/app/lib/utils/currency";
import { ExportExerciseDialog } from './export-exercise-dialog';
import { format, subDays } from 'date-fns';

// Constants
const COLORS = {
    primary: rgb(0.1, 0.2, 0.4),      // Dark blue
    secondary: rgb(0.4, 0.5, 0.6),    // Steel blue
    tertiary: rgb(0.6, 0.7, 0.8),     // Light blue
    accent: rgb(0.2, 0.3, 0.4),       // Navy
    text: rgb(0.1, 0.1, 0.1),         // Near black
    headerText: rgb(1, 1, 1),         // White
    gridLine: rgb(0.8, 0.8, 0.8),     // Light gray
    warning: rgb(0.8, 0.2, 0.2),      // Red
    header: rgb(0.95, 0.95, 0.95),    // Very light gray
    border: rgb(0.7, 0.7, 0.7),       // Medium gray
    background: rgb(1, 1, 1),         // White
    lightAccent: rgb(0.9, 0.95, 1)    // Very light blue
};

// Font variables
let helvetica: PDFFont;
let helveticaBold: PDFFont;
let timesRoman: PDFFont;

// Interfaces
interface ExportAdditionalInfo {
    classification: string;
    commandAuthority: string;
    exerciseCommander: string;
    missionObjective: string;
    additionalNotes: string;
}

interface SystemCost {
    systemName: string;
    system: {
        name: string;
        basePrice: number;
    };
    baseHardwareCost: number;
    fsrCost: number;
    consumablesCost: number;
    monthlyConsumablesCost: number;
    totalMonthlyRecurring: number;
    totalForDuration: number;
    totalCost: number;
    duration: number;
    launchesPerDay: number;
    consumableBreakdown: Array<{
        name: string;
        quantity: number;
        unitCost: number;
        monthlyCost: number;
        isPerLaunch: boolean;
        launchesPerDay: number;
    }> | null[];
}

interface ExportExerciseButtonProps {
    exercise: {
        name: string;
        description?: string;
        startDate: string;
        endDate: string;
        location: string;
        totalBudget?: number;
        totalCost: number;
        requiredDates: Array<{
            name: string;
            description: string;
            dueDate: string;
            type: string;
        }>;
        systems: Array<{
            system: {
                name: string;
                basePrice: number;
                leadTimes?: Array<{
                    name: string;
                    description: string;
                    daysBeforeStart: number;
                    type: string;
                }>;
            };
            quantity: number;
            fsrSupport: string;
            fsrCost: number;
            launchesPerDay?: number;
            consumablePresets: Array<{
                preset: {
                    name: string;
                    consumable?: {
                        name: string;
                        unit: string;
                        currentUnitCost: number;
                    };
                };
                quantity: number;
            }>;
        }>;
    };
}

interface ExportSystemType {
    system: {
        name: string;
        basePrice: number;
    };
    quantity: number;
    fsrSupport: string;
    fsrCost: number;
    launchesPerDay?: number;
    consumablePresets: Array<{
        preset: {
            name: string;
            consumable?: {
                name: string;
                unit: string;
                currentUnitCost: number;
            };
        };
        quantity: number;
    }>;
}

interface RequiredDate {
    name: string;
    description: string;
    dueDate: string;
    type: string;
}

// Utility Functions
const isBalloonGas = (name: string): boolean => {
    return name.toLowerCase().includes('balloon') || 
           name.toLowerCase().includes('helium') || 
           name.toLowerCase().includes('hydrogen');
};

const loadFonts = async (pdfDoc: PDFDocument) => {
    helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
};

const getDurationInMonths = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
};

const calculateMonthlyConsumables = (system: ExportSystemType): number => {
    return system.consumablePresets.reduce((total, preset) => {
        if (!preset.preset?.consumable) return total;
        
        let quantity = preset.quantity || 0;
        const unitCost = preset.preset.consumable.currentUnitCost || 0;
        
        if (isBalloonGas(preset.preset.consumable.name)) {
            quantity = system.launchesPerDay ? quantity * system.launchesPerDay * 30 : 0;
        }
        
        return total + (unitCost * quantity);
    }, 0);
};

// PDF Drawing Functions
const drawHeader = (page: PDFPage, title: string = 'EXERCISE COST ANALYSIS REPORT') => {
    // Classification banner
    page.drawRectangle({
        x: 0,
        y: 772,
        width: 612,
        height: 20,
        color: COLORS.primary
    });

    // Main header
    page.drawRectangle({
        x: 0,
        y: 722,
        width: 612,
        height: 50,
        color: COLORS.accent
    });

    // Title text
    page.drawText(title, {
        x: 306 - (helveticaBold.widthOfTextAtSize(title, 16) / 2),
        y: 740,
        size: 16,
        font: helveticaBold,
        color: COLORS.headerText
    });

    // Decorative line
    page.drawLine({
        start: { x: 50, y: 722 },
        end: { x: 562, y: 722 },
        thickness: 2,
        color: COLORS.primary
    });
};

const drawSection = (page: PDFPage, title: string, y: number) => {
    // Section title
    page.drawText(title.toUpperCase(), {
        x: 50,
        y,
        size: 12,
        font: helveticaBold,
        color: COLORS.primary
    });

    // Underline
    page.drawLine({
        start: { x: 50, y: y - 5 },
        end: { x: 562, y: y - 5 },
        thickness: 1,
        color: COLORS.primary
    });
};

const drawGridLines = (page: PDFPage, startY: number, rowCount: number, columnWidths: number[]) => {
    const totalWidth = columnWidths.reduce((acc, width) => acc + width, 0);
    
    // Horizontal lines
    for (let i = 0; i <= rowCount; i++) {
        page.drawLine({
            start: { x: 50, y: startY - (i * 20) },
            end: { x: 50 + totalWidth, y: startY - (i * 20) },
            thickness: 0.5,
            color: COLORS.gridLine
        });
    }

    // Vertical lines
    let x = 50;
    columnWidths.forEach(width => {
        page.drawLine({
            start: { x, y: startY },
            end: { x, y: startY - (rowCount * 20) },
            thickness: 0.5,
            color: COLORS.gridLine
        });
        x += width;
    });
};

const drawSystemDetails = (page: PDFPage, system: ExportSystemType, startY: number) => {
    drawHeader(page);
    
    // System Overview
    drawSection(page, 'System Configuration', startY - 50);
    
    const details = [
        ['Quantity:', system.quantity.toString()],
        ['Base Price:', formatCurrency(system.system.basePrice)],
        ['FSR Support:', system.fsrSupport],
        ['Monthly FSR Cost:', formatCurrency(system.fsrCost)],
        ['Launches per Day:', (system.launchesPerDay || 1).toString()]
    ];

    details.forEach((detail, index) => {
        const y = startY - 80 - (index * 25);
        
        // Label
        page.drawText(detail[0], {
            x: 70,
            y,
            size: 10,
            font: helveticaBold,
            color: COLORS.text
        });

        // Value
        page.drawText(detail[1], {
            x: 200,
            y,
            size: 10,
            font: helvetica,
            color: COLORS.text
        });
    });

    // Monthly Costs
    drawSection(page, 'Monthly Recurring Costs', startY - 200);
    
    const monthlyFSR = system.fsrSupport !== 'NONE' ? (system.fsrCost || 0) : 0;
    const monthlyConsumables = calculateMonthlyConsumables(system);
    const totalMonthly = monthlyFSR + monthlyConsumables;

    const monthlyCosts = [
        ['FSR Support:', formatCurrency(monthlyFSR)],
        ['Consumables:', formatCurrency(monthlyConsumables)],
        ['Total Monthly:', formatCurrency(totalMonthly)]
    ];

    monthlyCosts.forEach((cost, index) => {
        const y = startY - 230 - (index * 25);
        
        // Label
        page.drawText(cost[0], {
            x: 70,
            y,
            size: 10,
            font: helveticaBold,
            color: COLORS.text
        });

        // Value
        page.drawText(cost[1], {
            x: 200,
            y,
            size: 10,
            font: helvetica,
            color: COLORS.text
        });
    });

    // Consumables Detail
    if (system.consumablePresets && system.consumablePresets.length > 0) {
        drawSection(page, 'Consumables Detail', startY - 320);
        drawConsumablesTable(page, system, startY - 350);
    }
};

const drawConsumablesTable = (page: PDFPage, system: ExportSystemType, startY: number) => {
    const columnWidths = [200, 80, 100, 120];
    const headers = ['Item', 'Quantity', 'Unit Cost', 'Monthly Cost'];
    
    // Draw table structure
    drawGridLines(page, startY, system.consumablePresets.length + 1, columnWidths);
    
    // Headers
    headers.forEach((header, index) => {
        let x = 50;
        for (let i = 0; i < index; i++) {
            x += columnWidths[i];
        }
        
        page.drawText(header, {
            x: x + 5,
            y: startY - 15,
            size: 10,
            font: helveticaBold,
            color: COLORS.text
        });
    });

    // Data rows
    system.consumablePresets.forEach((preset, rowIndex) => {
        if (!preset.preset?.consumable) return;
        
        const y = startY - ((rowIndex + 2) * 20);
        let quantity = preset.quantity || 0;
        const unitCost = preset.preset.consumable.currentUnitCost || 0;
        
        if (isBalloonGas(preset.preset.consumable.name)) {
            quantity = quantity * (system.launchesPerDay || 1) * 30;
        }
        
        const monthlyCost = unitCost * quantity;
        
        const rowData = [
            preset.preset.name,
            quantity.toString(),
            formatCurrency(unitCost),
            formatCurrency(monthlyCost)
        ];
        
        let x = 50;
        rowData.forEach((text, colIndex) => {
            page.drawText(text, {
                x: x + 5,
                y,
                size: 10,
                font: helvetica,
                color: COLORS.text
            });
            x += columnWidths[colIndex];
        });
    });
};

const drawLeadTimes = (page: PDFPage, requiredDates: RequiredDate[], startY: number) => {
  const sectionPadding = 40;
  const rowHeight = 40;
  const headerHeight = 50;
  
  // Section header
  page.drawRectangle({
    x: 50,
    y: startY,
    width: 512,
    height: headerHeight,
    color: COLORS.primary
  });

  page.drawText('REQUIRED LEAD TIMES', {
    x: 70,
    y: startY + (headerHeight/2) + 5,
    size: 14,
    font: helveticaBold,
    color: COLORS.headerText
  });

  // Header row
  const tableStartY = startY - headerHeight - sectionPadding;
  page.drawRectangle({
    x: 50,
    y: tableStartY,
    width: 512,
    height: rowHeight,
    color: COLORS.header
  });

  const columnWidths = [200, 180, 100, 100];
  const headers = ['Item', 'Description', 'Due Date', 'Type'];
  
  let xOffset = 70;
  headers.forEach((header, index) => {
    page.drawText(header, {
      x: xOffset,
      y: tableStartY + (rowHeight/2) + 5,
      size: 10,
      font: helveticaBold,
      color: COLORS.primary
    });
    xOffset += columnWidths[index];
  });

  // Data rows
  requiredDates.forEach((date, index) => {
    const rowY = tableStartY - ((index + 1) * rowHeight);
    const isOverdue = new Date(date.dueDate) < new Date();
    
    // Row background
    if (index % 2 === 0) {
      page.drawRectangle({
        x: 50,
        y: rowY,
        width: 512,
        height: rowHeight,
        color: COLORS.lightAccent,
        opacity: 0.5
      });
    }

    const textY = rowY + (rowHeight/2) + 5;
    const textColor = isOverdue ? COLORS.warning : COLORS.text;

    // Content
    page.drawText(date.name, {
      x: 70,
      y: textY,
      size: 9,
      font: helveticaBold,
      color: textColor,
      maxWidth: 180
    });
    
    page.drawText(date.description || '', {
      x: 270,
      y: textY,
      size: 9,
      font: helvetica,
      color: textColor,
      maxWidth: 160
    });
    
    const formattedDate = format(new Date(date.dueDate), 'MMM d, yyyy');
    page.drawText(formattedDate, {
      x: 450,
      y: textY,
      size: 9,
      font: helvetica,
      color: textColor,
    });
    
    // Type badge
    const typeWidth = helvetica.widthOfTextAtSize(date.type, 9) + 20;
    page.drawRectangle({
      x: 545,
      y: textY - 8,
      width: typeWidth,
      height: 18,
      color: isOverdue ? rgb(1, 0.95, 0.95) : COLORS.header,
      borderColor: isOverdue ? COLORS.warning : COLORS.border,
      borderWidth: 1,
      opacity: 0.9
    });

    page.drawText(date.type, {
      x: 550,
      y: textY - 4,
      size: 9,
      font: helveticaBold,
      color: isOverdue ? COLORS.warning : COLORS.primary,
    });
  });

  return tableStartY - (requiredDates.length * rowHeight) - sectionPadding;
};

const drawSystemCosts = (page: PDFPage, system: any, startY: number) => {
  const padding = 40;
  const graphWidth = 500;
  const graphHeight = 200;

  // Calculate costs (reference: app/components/exercises/system-cost-analysis.tsx startLine: 11 endLine: 27)
  const duration = getDurationInMonths(system.startDate, system.endDate) || 1;
  const hardwareCost = system.system.basePrice * system.quantity;
  const monthlyFSR = system.fsrSupport !== 'NONE' ? (system.fsrCost || 0) : 0;
  const monthlyConsumables = system.consumablePresets?.reduce((total: number, preset: any) => {
    if (!preset.preset?.consumable) return total;
    let quantity = preset.quantity || 0;
    const unitCost = preset.preset.consumable.currentUnitCost || 0;
    
    if (isBalloonGas(preset.preset.consumable.name)) {
      quantity = quantity * (system.launchesPerDay || 1) * 30;
    }
    
    return total + (unitCost * quantity);
  }, 0) || 0;

  // System header
  page.drawRectangle({
    x: 50,
    y: startY,
    width: 512,
    height: 50,
    color: COLORS.primary
  });

  page.drawText(`System Cost Analysis: ${system.system.name}`, {
    x: 70,
    y: startY + 18,
    size: 14,
    font: helveticaBold,
    color: COLORS.headerText
  });

  // Cost summary grid
  const summaryStartY = startY - 80;
  const summaryData = [
    ['Total Hardware Cost:', formatCurrency(hardwareCost)],
    ['Monthly FSR Cost:', formatCurrency(monthlyFSR)],
    ['Monthly Consumables:', formatCurrency(monthlyConsumables)],
    ['Launches per Day:', system.launchesPerDay?.toString() || 'N/A'],
    ['FSR Support Level:', system.fsrSupport]
  ];

  summaryData.forEach((row, index) => {
    const y = summaryStartY - (index * 30);
    
    // Label
    page.drawText(row[0], {
      x: 70,
      y,
      size: 10,
      font: helveticaBold,
      color: COLORS.text
    });
    
    // Value
    page.drawText(row[1], {
      x: 300,
      y,
      size: 10,
      font: helvetica,
      color: COLORS.text
    });
  });

  // Cost breakdown chart
  const chartStartY = summaryStartY - 200;
  const costs = [
    { name: 'Hardware', value: hardwareCost, color: COLORS.primary },
    { name: 'Monthly FSR', value: monthlyFSR, color: COLORS.secondary },
    { name: 'Monthly Consumables', value: monthlyConsumables, color: COLORS.tertiary }
  ];

  // Draw chart title
  page.drawText('Monthly Cost Breakdown', {
    x: 70,
    y: chartStartY + 20,
    size: 12,
    font: helveticaBold,
    color: COLORS.text
  });

  // Enhanced bar chart with gradients and labels
  const maxValue = Math.max(...costs.map(c => c.value));
  const barWidth = (graphWidth - (padding * 3)) / costs.length;

  costs.forEach((cost, index) => {
    const barHeight = (cost.value / maxValue) * graphHeight;
    const x = 70 + (index * (barWidth + padding));
    const y = chartStartY - graphHeight;

    // Bar shadow
    page.drawRectangle({
      x: x + 2,
      y: y - 2,
      width: barWidth,
      height: barHeight,
      color: rgb(0.9, 0.9, 0.9),
      opacity: 0.5
    });

    // Gradient bar
    for (let i = 0; i < barHeight; i++) {
      page.drawLine({
        start: { x, y: y + i },
        end: { x: x + barWidth, y: y + i },
        thickness: 1,
        color: cost.color,
        opacity: 0.7 + (i / barHeight) * 0.3
      });
    }

    // Value label
    page.drawText(formatCurrency(cost.value), {
      x: x + (barWidth/2) - 30,
      y: y + barHeight + 5,
      size: 8,
      font: helvetica,
      color: COLORS.text
    });

    // Category label
    page.drawText(cost.name, {
      x: x + (barWidth/2) - 25,
      y: y - 15,
      size: 8,
      font: helveticaBold,
      color: COLORS.text
    });
  });

  return chartStartY - graphHeight - padding;
};

const addPageDecorations = (page: PDFPage, pageNumber: number, totalPages: number) => {
    // Corner decorations
    const cornerSize = 20;
    [
        [50, 722],
        [562 - cornerSize, 722],
        [50, 50],
        [562 - cornerSize, 50]
    ].forEach(([x, y]) => {
        page.drawRectangle({
            x,
            y,
            width: cornerSize,
            height: cornerSize,
            color: COLORS.accent,
            opacity: 0.1
        });
    });

    // Page numbers
    const pageText = `Page ${pageNumber} of ${totalPages}`;
    const textWidth = helvetica.widthOfTextAtSize(pageText, 9);
    
    page.drawLine({
        start: { x: 512 - textWidth - 10, y: 35 },
        end: { x: 512 + 10, y: 35 },
        thickness: 0.5,
        color: COLORS.accent
    });

    page.drawText(pageText, {
        x: 512 - textWidth,
        y: 30,
        size: 9,
        font: helvetica,
        color: COLORS.accent
    });
};

export function ExportExerciseButton({ exercise }: ExportExerciseButtonProps) {
    const handleExport = async (additionalInfo: ExportAdditionalInfo) => {
        const pdfDoc = await PDFDocument.create();
        await loadFonts(pdfDoc);

        // Cover page
        const coverPage = pdfDoc.addPage([612, 792]);

        // Classification header
        coverPage.drawText(additionalInfo.classification, {
            x: 50,
            y: 770,
            size: 12,
            font: helveticaBold,
            color: COLORS.text,
        });

        // Title header
        coverPage.drawRectangle({
            x: 0,
            y: 700,
            width: 612,
            height: 50,
            color: COLORS.accent,
        });

        coverPage.drawText('EXERCISE COST ANALYSIS REPORT', {
            x: 50,
            y: 722,
            size: 24,
            font: helveticaBold,
            color: COLORS.headerText,
        });

        // Exercise Details
        const details = [
            ['Exercise Name:', exercise.name],
            ['Command Authority:', additionalInfo.commandAuthority],
            ['Exercise Commander:', additionalInfo.exerciseCommander],
            ['Location:', exercise.location],
            ['Duration:', `${format(new Date(exercise.startDate), 'PPP')} - ${format(new Date(exercise.endDate), 'PPP')}`],
            ['Mission Objective:', additionalInfo.missionObjective],
        ];

        details.forEach((detail, index) => {
            const y = 650 - (index * 25);
            
            // Label
            coverPage.drawText(detail[0], {
                x: 70,
                y,
                size: 12,
                font: helveticaBold,
                color: COLORS.text,
            });
            
            // Value
            coverPage.drawText(detail[1], {
                x: 220,
                y,
                size: 12,
                font: helvetica,
                color: COLORS.text,
                maxWidth: 350,
            });
        });

        // Lead times section
        if (exercise.requiredDates.length > 0) {
            const currentY = drawLeadTimes(coverPage, exercise.requiredDates, 450);
        }

        // Cost Summary
        drawSection(coverPage, 'COST SUMMARY', 450);

        const monthlyRecurring = exercise.systems.reduce((total, sys) => {
            const fsrCost = sys.fsrSupport !== 'NONE' ? (sys.fsrCost || 0) : 0;
            const consumablesCost = calculateMonthlyConsumables(sys);
            return total + fsrCost + consumablesCost;
        }, 0);

        const oneTimeCosts = exercise.systems.reduce((total, sys) => 
            total + (sys.system.basePrice * sys.quantity), 0);

        const costSummary = [
            ['Total Budget:', formatCurrency(exercise.totalBudget || 0)],
            ['One-Time Costs:', formatCurrency(oneTimeCosts)],
            ['Monthly Recurring:', formatCurrency(monthlyRecurring)],
            ['Total Exercise Cost:', formatCurrency(exercise.totalCost)],
        ];

        costSummary.forEach((cost, index) => {
            const y = 420 - (index * 20);
            
            // Label
            coverPage.drawText(cost[0], {
                x: 70,
                y,
                size: 12,
                font: helveticaBold,
                color: COLORS.text,
            });
            
            // Value
            coverPage.drawText(cost[1], {
                x: 220,
                y,
                size: 12,
                font: helvetica,
                color: COLORS.text,
            });
        });

        // Additional Notes
        if (additionalInfo.additionalNotes) {
            drawSection(coverPage, 'ADDITIONAL NOTES', 300);
            coverPage.drawText(additionalInfo.additionalNotes, {
                x: 70,
                y: 270,
                size: 10,
                font: helvetica,
                color: COLORS.text,
                maxWidth: 472,
            });
        }

        // System Details Pages
        exercise.systems.forEach((system, index) => {
            const page = pdfDoc.addPage([612, 792]);
            const exportSystem: ExportSystemType = {
                system: system.system,
                quantity: system.quantity,
                fsrSupport: system.fsrSupport,
                fsrCost: system.fsrCost,
                launchesPerDay: system.launchesPerDay,
                consumablePresets: system.consumablePresets
            };
            
            // Classification header
            page.drawText(additionalInfo.classification, {
                x: 50,
                y: 770,
                size: 12,
                font: helveticaBold,
                color: COLORS.text,
            });
            
            drawSystemDetails(page, exportSystem, 700);
            addPageDecorations(page, index + 2, exercise.systems.length + 1);
        });

        // Save and download
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${exercise.name.replace(/\s+/g, '_')}_report.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Get required dates from systems
    const requiredDates = exercise.systems?.reduce((dates: RequiredDate[], sys) => {
        if (!sys.system?.leadTimes?.length) return dates;
        
        return [
            ...dates,
            ...sys.system.leadTimes.map(lt => ({
                name: lt.name,
                description: lt.description,
                dueDate: format(subDays(new Date(exercise.startDate), lt.daysBeforeStart), 'PPP p'),
                type: lt.type
            }))
        ];
    }, []) || [];

    return (
        <ExportExerciseDialog 
            exercise={{
                name: exercise.name,
                startDate: format(new Date(exercise.startDate), 'PPP p'),
                endDate: format(new Date(exercise.endDate), 'PPP p'),
                location: exercise.location || 'Not specified',
                totalCost: exercise.totalCost,
                requiredDates: exercise.requiredDates,
                systems: exercise.systems.map(sys => ({
                    system: {
                        name: sys.system?.name || 'Unknown System',
                        basePrice: sys.system?.basePrice || 0,
                        leadTimes: sys.system?.leadTimes
                    },
                    quantity: sys.quantity || 1,
                    fsrSupport: sys.fsrSupport || 'NONE',
                    fsrCost: sys.fsrCost || 0,
                    launchesPerDay: sys.launchesPerDay,
                    consumablePresets: sys.consumablePresets || []
                }))
            }} 
            onExport={handleExport} 
        />
    );
}