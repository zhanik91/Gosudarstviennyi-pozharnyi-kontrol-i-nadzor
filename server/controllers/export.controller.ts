import type { Request, Response } from "express";
import { storage } from "../storage";
import XLSX from 'xlsx';

export class ExportController {

  // Экспорт отчетов в XLSX
  async exportReport(req: Request, res: Response) {
    try {
      const { form, period, orgId, includeChildren } = req.query;

      // Проверка доступа к организации
      const organizations = await storage.getOrganizations();
      const { assertOrgScope } = await import('../services/authz');

      try {
        assertOrgScope(organizations, req.user?.organizationId || 'mcs-rk', orgId as string);
      } catch (error: any) {
        return res.status(403).json({ ok: false, msg: 'forbidden' });
      }

      // Получение данных отчета
      const reportData = await storage.getReportData({
        orgId: orgId as string,
        period: period as string,
        form: form as string,
        includeChildren: includeChildren === 'true'
      });

      // Создание Excel файла
      const workbook = XLSX.utils.book_new();

      const formStr = form as string;
      const periodStr = period as string;

      switch (formStr) {
        case '1-osp':
          addOSPSheet(workbook, reportData, periodStr);
          break;
        case '2-ssg':
          addSSGSheet(workbook, reportData, periodStr);
          break;
        case '3-spvp':
          addSPVPSheet(workbook, reportData, periodStr);
          break;
        case '4-sovp':
          addSOVPSheet(workbook, reportData, periodStr);
          break;
        case '5-spzs':
          addSPZSSheet(workbook, reportData, periodStr);
          break;
        case '6-sspz':
          addSSPZSheet(workbook, reportData, periodStr);
          break;
        case 'co':
          addCOSheet(workbook, reportData, periodStr);
          break;
        default:
          // Добавляем все формы
          addOSPSheet(workbook, reportData, periodStr);
          addSSGSheet(workbook, reportData, periodStr);
          addSPVPSheet(workbook, reportData, periodStr);
          addSOVPSheet(workbook, reportData, periodStr);
          addSPZSSheet(workbook, reportData, periodStr);
          addSSPZSheet(workbook, reportData, periodStr);
          addCOSheet(workbook, reportData, periodStr);
      }

      // Генерация Excel файла
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const filename = `report_${form || 'all'}_${period}_${orgId}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(excelBuffer);

    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({ ok: false, msg: 'Export failed' });
    }
  }
}

// Helper functions (moved from original route file)
function addOSPSheet(workbook: XLSX.WorkBook, data: any, period: string) {
  const sheetData = [
    ['Форма 1-ОСП: Общие сведения о пожарах и гибели людей'],
    ['Период:', period],
    [''],
    ['Показатель', 'Всего', 'в том числе в городах', 'в сельской местности'],
    ['Количество пожаров', data.osp?.totalFires || 0, data.osp?.cityFires || 0, data.osp?.ruralFires || 0],
    ['Погибло людей, всего', data.osp?.totalDeaths || 0, data.osp?.cityDeaths || 0, data.osp?.ruralDeaths || 0],
    ['из них детей до 17 лет', data.osp?.childDeaths || 0, data.osp?.cityChildDeaths || 0, data.osp?.ruralChildDeaths || 0],
    ['Травмировано людей', data.osp?.totalInjured || 0, data.osp?.cityInjured || 0, data.osp?.ruralInjured || 0],
    ['Материальный ущерб (тыс. тенге)', 
     (data.osp?.totalDamage || 0).toFixed(1), 
     (data.osp?.cityDamage || 0).toFixed(1), 
     (data.osp?.ruralDamage || 0).toFixed(1)],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, '1-ОСП');
}

function addSSGSheet(workbook: XLSX.WorkBook, data: any, period: string) {
  const sheetData = [
    ['Форма 2-ССГ: Сведения о случаях горения'],
    ['Период:', period],
    [''],
    ['№', 'Наименование', 'Количество'],
    ['1', 'Загорание в жилом секторе', data.ssg?.residential || 0],
    ['2', 'Загорание транспорта', data.ssg?.transport || 0],
    ['3', 'Загорание мусора', data.ssg?.waste || 0],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, '2-ССГ');
}

function addSPVPSheet(workbook: XLSX.WorkBook, data: any, period: string) {
  const sheetData: any[][] = [
    ['Форма 3-СПВП: Сведения о причинах возникновения пожаров'],
    ['Период:', period],
    [''],
    ['Код', 'Причина', 'Всего', 'в т.ч. ОВСР'],
  ];

  if (data.spvp?.causes) {
    data.spvp.causes.forEach((cause: any) => {
      sheetData.push([
        cause.code,
        cause.name,
        cause.total || 0,
        cause.ovsr || 0
      ]);
    });
  }

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, '3-СПВП');
}

function addSOVPSheet(workbook: XLSX.WorkBook, data: any, period: string) {
  const sheetData: any[][] = [
    ['Форма 4-СОВП: Сведения об объектах возникновения пожаров'],
    ['Период:', period],
    [''],
    ['Код', 'Объект', 'Всего', 'в т.ч. ОВСР'],
  ];

  if (data.sovp?.objects) {
    data.sovp.objects.forEach((obj: any) => {
      sheetData.push([
        obj.code,
        obj.name,
        obj.total || 0,
        obj.ovsr || 0
      ]);
    });
  }

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, '4-СОВП');
}

function addSPZSSheet(workbook: XLSX.WorkBook, data: any, period: string) {
  const sheetData = [
    ['Форма 5-СПЖС: Сведения о пожарах в жилом секторе'],
    ['Период:', period],
    [''],
  ];

  if (data.spzs) {
    sheetData.push(['Раздел 1: По социальному положению погибших']);
    sheetData.push(['Показатель', 'Количество']);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, '5-СПЖС');
}

function addSSPZSheet(workbook: XLSX.WorkBook, data: any, period: string) {
  const sheetData = [
    ['Форма 6-ССПЗ: Сведения о степных пожарах'],
    ['Период:', period],
    [''],
    ['Таблица 1: Пожары'],
    ['Показатель', 'Количество'],
    ['Всего пожаров', data.sspz?.totalFires || 0],
    ['Площадь (га)', data.sspz?.totalArea || 0],
    [''],
    ['Таблица 2: Загорания'],
    ['Всего загораний', data.sspz?.totalIgnitions || 0],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, '6-ССПЗ');
}

function addCOSheet(workbook: XLSX.WorkBook, data: any, period: string) {
  const sheetData = [
    ['Форма СО: Отравления угарным газом без пожара'],
    ['Период:', period],
    [''],
    ['Показатель', 'Количество'],
    ['Всего случаев', data.co?.totalCases || 0],
    ['Погибло', data.co?.deaths || 0],
    ['из них детей', data.co?.childDeaths || 0],
    ['Травмировано', data.co?.injured || 0],
    ['из них детей', data.co?.childInjured || 0],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'СО');
}

export const exportController = new ExportController();
