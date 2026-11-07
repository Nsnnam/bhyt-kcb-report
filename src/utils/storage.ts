import { get, set, del } from 'idb-keyval';
import { DrugItem, DVKTItem, ProcessedReportData, ReportConfig } from '../types';
import defaultDrugs from '../data/thuoc_default.json';
import defaultDVKT from '../data/dvkt_default.json';

const DRUGS_KEY = 'bhyt_catalog_drugs';
const DVKT_KEY = 'bhyt_catalog_dvkt';
const REPORT_DATA_KEY = 'bhyt_last_report_data';
const REPORT_CONFIG_KEY = 'bhyt_report_config';

export async function getDrugsCatalog(): Promise<DrugItem[]> {
  try {
    const saved = await get<DrugItem[]>(DRUGS_KEY);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
  } catch (err) {
    console.warn('Failed to load drugs from IndexedDB, falling back to default:', err);
  }
  return (defaultDrugs as unknown) as DrugItem[];
}

export async function saveDrugsCatalog(items: DrugItem[]): Promise<void> {
  await set(DRUGS_KEY, items);
}

export async function getDVKTCatalog(): Promise<DVKTItem[]> {
  try {
    const saved = await get<DVKTItem[]>(DVKT_KEY);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
  } catch (err) {
    console.warn('Failed to load DVKT from IndexedDB, falling back to default:', err);
  }
  return (defaultDVKT as unknown) as DVKTItem[];
}

export async function saveDVKTCatalog(items: DVKTItem[]): Promise<void> {
  await set(DVKT_KEY, items);
}

export async function resetAllCatalogs(): Promise<{ drugs: DrugItem[]; dvkt: DVKTItem[] }> {
  await del(DRUGS_KEY);
  await del(DVKT_KEY);
  return {
    drugs: (defaultDrugs as unknown) as DrugItem[],
    dvkt: (defaultDVKT as unknown) as DVKTItem[]
  };
}

export async function getSavedReport(): Promise<ProcessedReportData | null> {
  try {
    const saved = await get<ProcessedReportData>(REPORT_DATA_KEY);
    return saved || null;
  } catch {
    return null;
  }
}

export async function saveReportData(report: ProcessedReportData): Promise<void> {
  await set(REPORT_DATA_KEY, report);
}

export async function getSavedConfig(): Promise<ReportConfig | null> {
  try {
    return await get<ReportConfig>(REPORT_CONFIG_KEY) || null;
  } catch {
    return null;
  }
}

export async function saveConfig(config: ReportConfig): Promise<void> {
  await set(REPORT_CONFIG_KEY, config);
}
