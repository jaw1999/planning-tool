import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/app/lib/utils/auth';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateToken(request);
    if (!authResult.valid || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, filters, exerciseId } = body;

    let data: any = {};
    let filename = 'export';

    switch (type) {
      case 'exercise':
        data = await exportExerciseData(exerciseId);
        filename = `exercise-${data.exercise?.name || 'unknown'}-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'equipment':
        data = await exportEquipmentData(filters);
        filename = `equipment-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'systems':
        data = await exportSystemsData(filters);
        filename = `systems-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'analytics':
        data = await exportAnalyticsData(filters);
        filename = `analytics-${new Date().toISOString().split('T')[0]}`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    const workbook = await createExcelWorkbook(data, type);
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
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
    where: { exerciseId }
  });

  return { exercise, costRecords };
}

async function exportEquipmentData(filters: any) {
  const equipment = await prisma.equipment.findMany({
    include: {
      documents: true,
      systemARelations: true,
      systemBRelations: true
    }
  });

  return { equipment };
}

async function exportSystemsData(filters: any) {
  const systems = await prisma.system.findMany({
    include: {
      systemDocuments: true,
      exercises: {
        include: {
          exercise: true
        }
      }
    }
  });

  return { systems };
}

async function exportAnalyticsData(filters: any) {
  const costRecords = await prisma.costRecord.findMany({
    include: {
      exercise: true,
      system: true
    },
    orderBy: { date: 'asc' }
  });

  const exercises = await prisma.exercise.findMany({
    include: {
      systems: {
        include: {
          system: true
        }
      }
    }
  });

  return { costRecords, exercises };
}

async function createExcelWorkbook(data: any, type: string): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  
  workbook.creator = 'Military Planning Tool';
  workbook.lastModifiedBy = 'Military Planning Tool';
  workbook.created = new Date();
  workbook.modified = new Date();

  switch (type) {
    case 'exercise':
      await createExerciseWorkbook(workbook, data);
      break;
    case 'equipment':
      await createEquipmentWorkbook(workbook, data);
      break;
    case 'systems':
      await createSystemsWorkbook(workbook, data);
      break;
    case 'analytics':
      await createAnalyticsWorkbook(workbook, data);
      break;
  }

  return workbook;
}

async function createExerciseWorkbook(workbook: ExcelJS.Workbook, data: any) {
  const { exercise, costRecords } = data;

  // Exercise Overview Sheet
  const overviewSheet = workbook.addWorksheet('Exercise Overview');
  
  // Header styling
  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } },
    border: {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    }
  };

  // Exercise details
  overviewSheet.addRow(['Exercise Information']);
  overviewSheet.getRow(1).font = { bold: true, size: 14 };
  
  overviewSheet.addRow(['Name', exercise?.name || 'N/A']);
  overviewSheet.addRow(['Description', exercise?.description || 'N/A']);
  overviewSheet.addRow(['Start Date', exercise?.startDate ? new Date(exercise.startDate).toLocaleDateString() : 'N/A']);
  overviewSheet.addRow(['End Date', exercise?.endDate ? new Date(exercise.endDate).toLocaleDateString() : 'N/A']);
  overviewSheet.addRow(['Location', exercise?.location || 'N/A']);
  overviewSheet.addRow(['Status', exercise?.status || 'N/A']);
  overviewSheet.addRow(['Total Budget', exercise?.totalBudget ? `$${exercise.totalBudget.toLocaleString()}` : 'N/A']);

  // Systems Sheet
  const systemsSheet = workbook.addWorksheet('Systems');
  const systemHeaders = ['System Name', 'Quantity', 'FSR Support', 'FSR Cost', 'Launches/Day'];
  systemsSheet.addRow(systemHeaders);
  systemsSheet.getRow(1).eachCell(cell => cell.style = headerStyle);

  exercise?.systems.forEach((es: any) => {
    systemsSheet.addRow([
      es.system.name,
      es.quantity,
      es.fsrSupport,
      es.fsrCost || 0,
      es.launchesPerDay
    ]);
  });

  // Cost Analysis Sheet
  const costSheet = workbook.addWorksheet('Cost Analysis');
  const costHeaders = ['Date', 'Type', 'Amount', 'Description', 'Category'];
  costSheet.addRow(costHeaders);
  costSheet.getRow(1).eachCell(cell => cell.style = headerStyle);

  costRecords.forEach((cost: any) => {
    costSheet.addRow([
      new Date(cost.date).toLocaleDateString(),
      cost.type,
      cost.amount,
      cost.description || '',
      cost.category || ''
    ]);
  });

  // Auto-fit columns
  [overviewSheet, systemsSheet, costSheet].forEach(sheet => {
    sheet.columns.forEach(column => {
      column.width = 15;
    });
  });
}

async function createEquipmentWorkbook(workbook: ExcelJS.Workbook, data: any) {
  const { equipment } = data;
  
  const equipmentSheet = workbook.addWorksheet('Equipment');
  
  const headers = [
    'Name', 'Model', 'Type', 'Status', 'Classification',
    'Acquisition Cost', 'FSR Support Cost', 'Location',
    'Serial Number', 'Asset Tag', 'Created Date'
  ];
  
  equipmentSheet.addRow(headers);
  equipmentSheet.getRow(1).eachCell(cell => {
    cell.style = {
      font: { bold: true, color: { argb: 'FFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } }
    };
  });

  equipment.forEach((eq: any) => {
    const productInfo = eq.productInfo || {};
    equipmentSheet.addRow([
      productInfo.name || 'N/A',
      productInfo.model || 'N/A',
      productInfo.type || 'N/A',
      eq.status || 'N/A',
      productInfo.classification?.level || 'N/A',
      eq.acquisitionCost || 0,
      eq.fsrSupportCost || 0,
      eq.location || 'N/A',
      eq.serialNumber || 'N/A',
      eq.assetTag || 'N/A',
      new Date(eq.createdAt).toLocaleDateString()
    ]);
  });

  equipmentSheet.columns.forEach(column => {
    column.width = 15;
  });
}

async function createSystemsWorkbook(workbook: ExcelJS.Workbook, data: any) {
  const { systems } = data;
  
  const systemsSheet = workbook.addWorksheet('Systems');
  
  const headers = [
    'Name', 'Description', 'Base Price', 'Has Licensing',
    'License Price', 'Lead Time (days)', 'Consumables Rate',
    'Created Date'
  ];
  
  systemsSheet.addRow(headers);
  systemsSheet.getRow(1).eachCell(cell => {
    cell.style = {
      font: { bold: true, color: { argb: 'FFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } }
    };
  });

  systems.forEach((system: any) => {
    systemsSheet.addRow([
      system.name,
      system.description || 'N/A',
      system.basePrice,
      system.hasLicensing ? 'Yes' : 'No',
      system.licensePrice || 0,
      system.leadTime,
      system.consumablesRate || 0,
      new Date(system.createdAt).toLocaleDateString()
    ]);
  });

  systemsSheet.columns.forEach(column => {
    column.width = 15;
  });
}

async function createAnalyticsWorkbook(workbook: ExcelJS.Workbook, data: any) {
  const { costRecords, exercises } = data;
  
  // Cost Records Sheet
  const costSheet = workbook.addWorksheet('Cost Records');
  const costHeaders = ['Date', 'Exercise', 'System', 'Type', 'Amount', 'Description'];
  costSheet.addRow(costHeaders);
  costSheet.getRow(1).eachCell(cell => {
    cell.style = {
      font: { bold: true, color: { argb: 'FFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } }
    };
  });

  costRecords.forEach((cost: any) => {
    costSheet.addRow([
      new Date(cost.date).toLocaleDateString(),
      cost.exercise?.name || 'N/A',
      cost.system?.name || 'N/A',
      cost.type,
      cost.amount,
      cost.description || ''
    ]);
  });

  // Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.addRow(['Analytics Summary']);
  summarySheet.getRow(1).font = { bold: true, size: 14 };
  
  summarySheet.addRow(['Total Exercises', exercises.length]);
  summarySheet.addRow(['Total Cost Records', costRecords.length]);
  
  const totalCosts = costRecords.reduce((sum: number, cost: any) => sum + cost.amount, 0);
  summarySheet.addRow(['Total Costs', `$${totalCosts.toLocaleString()}`]);

  [costSheet, summarySheet].forEach(sheet => {
    sheet.columns.forEach(column => {
      column.width = 15;
    });
  });
} 