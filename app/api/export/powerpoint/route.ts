import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/app/lib/utils/auth';
import { PrismaClient } from '@prisma/client';
import PptxGenJS from 'pptxgenjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateToken(request);
    if (!authResult.valid || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, exerciseId, includeCharts = true } = body;

    let data: any = {};
    let filename = 'export';

    switch (type) {
      case 'exercise':
        data = await exportExerciseData(exerciseId);
        filename = `exercise-${data.exercise?.name || 'unknown'}-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'analytics':
        data = await exportAnalyticsData();
        filename = `analytics-dashboard-${new Date().toISOString().split('T')[0]}`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    const pptx = await createPowerPointPresentation(data, type, includeCharts);
    
    // Generate buffer
    const buffer = await pptx.writeFile({ outputType: 'base64' });
    const binaryBuffer = Buffer.from(buffer, 'base64');

    return new NextResponse(binaryBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}.pptx"`,
        'Content-Length': binaryBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('PowerPoint export error:', error);
    return NextResponse.json(
      { error: 'Failed to export presentation' },
      { status: 500 }
    );
  }
}

async function exportExerciseData(exerciseId: string) {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: {
      systems: {
        include: {
          system: true,
          consumablePresets: {
            include: {
              preset: {
                include: {
                  consumable: true
                }
              }
            }
          }
        }
      }
    }
  });

  const costRecords = await prisma.costRecord.findMany({
    where: { exerciseId },
    orderBy: { date: 'asc' }
  });

  // Calculate cost summary
  const totalCosts = costRecords.reduce((sum, cost) => sum + cost.amount, 0);
  const costByType = costRecords.reduce((acc: any, cost) => {
    acc[cost.type] = (acc[cost.type] || 0) + cost.amount;
    return acc;
  }, {});

  return { exercise, costRecords, totalCosts, costByType };
}

async function exportAnalyticsData() {
  const exercises = await prisma.exercise.findMany({
    include: {
      systems: {
        include: {
          system: true
        }
      }
    }
  });

  const costRecords = await prisma.costRecord.findMany({
    include: {
      exercise: true,
      system: true
    },
    orderBy: { date: 'asc' }
  });

  const totalCosts = costRecords.reduce((sum, cost) => sum + cost.amount, 0);
  const exerciseCount = exercises.length;
  const systemCount = await prisma.system.count();

  return { exercises, costRecords, totalCosts, exerciseCount, systemCount };
}

async function createPowerPointPresentation(data: any, type: string, includeCharts: boolean): Promise<PptxGenJS> {
  const pptx = new PptxGenJS();
  
  // Set presentation properties
  pptx.author = 'Military Planning Tool';
  pptx.company = 'Military Planning Division';
  pptx.title = type === 'exercise' ? 'Exercise Report' : 'Analytics Dashboard';

  // Define common styles
  const titleStyle = {
    fontSize: 24,
    bold: true,
    color: '1F4E79'
  };

  const headerStyle = {
    fontSize: 18,
    bold: true,
    color: '2F5597'
  };

  const bodyStyle = {
    fontSize: 14,
    color: '333333'
  };

  switch (type) {
    case 'exercise':
      await createExercisePresentation(pptx, data, titleStyle, headerStyle, bodyStyle, includeCharts);
      break;
    case 'analytics':
      await createAnalyticsPresentation(pptx, data, titleStyle, headerStyle, bodyStyle, includeCharts);
      break;
  }

  return pptx;
}

async function createExercisePresentation(
  pptx: PptxGenJS, 
  data: any, 
  titleStyle: any, 
  headerStyle: any, 
  bodyStyle: any,
  includeCharts: boolean
) {
  const { exercise, costRecords, totalCosts, costByType } = data;

  // Title Slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: 'F8F9FA' };
  
  titleSlide.addText(`Exercise: ${exercise?.name || 'Unknown'}`, {
    x: 1, y: 2, w: 8, h: 1.5,
    ...titleStyle,
    align: 'center'
  });

  titleSlide.addText('Military Planning Tool Report', {
    x: 1, y: 3.5, w: 8, h: 0.8,
    fontSize: 16,
    color: '666666',
    align: 'center'
  });

  titleSlide.addText(`Generated: ${new Date().toLocaleDateString()}`, {
    x: 1, y: 5, w: 8, h: 0.5,
    fontSize: 12,
    color: '999999',
    align: 'center'
  });

  // Exercise Overview Slide
  const overviewSlide = pptx.addSlide();
  overviewSlide.addText('Exercise Overview', {
    x: 0.5, y: 0.5, w: 9, h: 1,
    ...titleStyle
  });

  const overviewData = [
    ['Field', 'Value'],
    ['Exercise Name', exercise?.name || 'N/A'],
    ['Description', exercise?.description || 'N/A'],
    ['Start Date', exercise?.startDate ? new Date(exercise.startDate).toLocaleDateString() : 'N/A'],
    ['End Date', exercise?.endDate ? new Date(exercise.endDate).toLocaleDateString() : 'N/A'],
    ['Location', exercise?.location || 'N/A'],
    ['Status', exercise?.status || 'N/A'],
    ['Total Budget', exercise?.totalBudget ? `$${exercise.totalBudget.toLocaleString()}` : 'N/A'],
    ['Systems Count', exercise?.systems?.length?.toString() || '0']
  ];

  overviewSlide.addTable(overviewData, {
    x: 0.5, y: 1.5, w: 9, h: 4,
    fontSize: 12,
    border: { pt: 1, color: 'CCCCCC' },
    fill: { color: 'F8F9FA' },
    color: '333333'
  });

  // Systems Breakdown Slide
  if (exercise?.systems?.length > 0) {
    const systemsSlide = pptx.addSlide();
    systemsSlide.addText('Systems Breakdown', {
      x: 0.5, y: 0.5, w: 9, h: 1,
      ...titleStyle
    });

    const systemsData = [
      ['System Name', 'Quantity', 'FSR Support', 'FSR Cost', 'Launches/Day']
    ];

    exercise.systems.forEach((es: any) => {
      systemsData.push([
        es.system.name,
        es.quantity.toString(),
        es.fsrSupport,
        es.fsrCost ? `$${es.fsrCost.toLocaleString()}` : '$0',
        es.launchesPerDay.toString()
      ]);
    });

    systemsSlide.addTable(systemsData, {
      x: 0.5, y: 1.5, w: 9, h: 4,
      fontSize: 11,
      border: { pt: 1, color: 'CCCCCC' },
      fill: { color: 'F8F9FA' },
      color: '333333'
    });
  }

  // Cost Analysis Slide
  const costSlide = pptx.addSlide();
  costSlide.addText('Cost Analysis', {
    x: 0.5, y: 0.5, w: 9, h: 1,
    ...titleStyle
  });

  costSlide.addText(`Total Cost: $${totalCosts.toLocaleString()}`, {
    x: 0.5, y: 1.8, w: 9, h: 0.6,
    ...headerStyle
  });

  // Cost breakdown by type
  const costBreakdownData = [
    ['Cost Type', 'Amount', 'Percentage']
  ];

  Object.entries(costByType).forEach(([type, amount]: [string, any]) => {
    const percentage = ((amount / totalCosts) * 100).toFixed(1);
    costBreakdownData.push([
      type,
      `$${amount.toLocaleString()}`,
      `${percentage}%`
    ]);
  });

  costSlide.addTable(costBreakdownData, {
    x: 0.5, y: 2.5, w: 6, h: 3,
    fontSize: 12,
    border: { pt: 1, color: 'CCCCCC' },
    fill: { color: 'F8F9FA' },
    color: '333333'
  });

  // Cost trend chart (if includeCharts)
  if (includeCharts && costRecords.length > 0) {
    const chartSlide = pptx.addSlide();
    chartSlide.addText('Cost Trend Over Time', {
      x: 0.5, y: 0.5, w: 9, h: 1,
      ...titleStyle
    });

    // Create chart data
    const chartData = costRecords.map((cost: any) => ({
      name: new Date(cost.date).toLocaleDateString(),
      value: cost.amount
    }));

    chartSlide.addChart(pptx.ChartType.line, chartData, {
      x: 1, y: 1.5, w: 8, h: 4.5,
      showTitle: false,
      showLegend: true,
      showValue: true
    });
  }

  // Summary Slide
  const summarySlide = pptx.addSlide();
  summarySlide.addText('Executive Summary', {
    x: 0.5, y: 0.5, w: 9, h: 1,
    ...titleStyle
  });

  const summaryPoints = [
    `Exercise involves ${exercise?.systems?.length || 0} different systems`,
    `Total projected cost: $${totalCosts.toLocaleString()}`,
    `Exercise duration: ${exercise?.startDate && exercise?.endDate ? 
      Math.ceil((new Date(exercise.endDate).getTime() - new Date(exercise.startDate).getTime()) / (1000 * 60 * 60 * 24)) + ' days' : 'TBD'}`,
    `Status: ${exercise?.status || 'Unknown'}`,
    `Cost records tracked: ${costRecords.length} entries`
  ];

  summaryPoints.forEach((point, index) => {
    summarySlide.addText(`• ${point}`, {
      x: 1, y: 2 + (index * 0.6), w: 8, h: 0.5,
      ...bodyStyle
    });
  });
}

async function createAnalyticsPresentation(
  pptx: PptxGenJS,
  data: any,
  titleStyle: any,
  headerStyle: any,
  bodyStyle: any,
  includeCharts: boolean
) {
  const { exercises, costRecords, totalCosts, exerciseCount, systemCount } = data;

  // Title Slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: 'F8F9FA' };
  
  titleSlide.addText('Analytics Dashboard', {
    x: 1, y: 2, w: 8, h: 1.5,
    ...titleStyle,
    align: 'center'
  });

  titleSlide.addText('Military Planning Tool Report', {
    x: 1, y: 3.5, w: 8, h: 0.8,
    fontSize: 16,
    color: '666666',
    align: 'center'
  });

  // Overview Slide
  const overviewSlide = pptx.addSlide();
  overviewSlide.addText('System Overview', {
    x: 0.5, y: 0.5, w: 9, h: 1,
    ...titleStyle
  });

  const metricsData = [
    ['Metric', 'Value'],
    ['Total Exercises', exerciseCount.toString()],
    ['Total Systems', systemCount.toString()],
    ['Total Cost Records', costRecords.length.toString()],
    ['Total Costs', `$${totalCosts.toLocaleString()}`],
    ['Average Cost per Exercise', exerciseCount > 0 ? `$${(totalCosts / exerciseCount).toLocaleString()}` : '$0']
  ];

  overviewSlide.addTable(metricsData, {
    x: 0.5, y: 1.5, w: 7, h: 3.5,
    fontSize: 14,
    border: { pt: 1, color: 'CCCCCC' },
    fill: { color: 'F8F9FA' },
    color: '333333'
  });

  // Exercise Status Summary
  const statusSlide = pptx.addSlide();
  statusSlide.addText('Exercise Status Summary', {
    x: 0.5, y: 0.5, w: 9, h: 1,
    ...titleStyle
  });

  const statusCounts = exercises.reduce((acc: any, ex: any) => {
    acc[ex.status] = (acc[ex.status] || 0) + 1;
    return acc;
  }, {});

  const statusData = [['Status', 'Count', 'Percentage']];
  Object.entries(statusCounts).forEach(([status, count]: [string, any]) => {
    const percentage = ((count / exerciseCount) * 100).toFixed(1);
    statusData.push([status, count.toString(), `${percentage}%`]);
  });

  statusSlide.addTable(statusData, {
    x: 0.5, y: 1.5, w: 6, h: 3,
    fontSize: 12,
    border: { pt: 1, color: 'CCCCCC' },
    fill: { color: 'F8F9FA' },
    color: '333333'
  });
} 