import { Capacitor } from '@capacitor/core';

export interface QueuedVitals {
  id: string;
  patientId: string;
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  temperature?: number;
  oxygenSaturation?: number;
  timestamp: string;
}

export interface QueuedEsas {
  id: string;
  patientId: string;
  pain: number;
  tiredness: number;
  drowsiness: number;
  nausea: number;
  lackOfAppetite: number;
  shortnessOfBreath: number;
  depression: number;
  anxiety: number;
  wellbeing: number;
  timestamp: string;
}

class SqliteCacheServiceImpl {
  private isSupported(): boolean {
    return Capacitor.isNativePlatform();
  }

  // Vitals Caching
  public async queueVitals(patientId: string, vitals: Omit<QueuedVitals, 'id' | 'patientId' | 'timestamp'>): Promise<void> {
    const record: QueuedVitals = {
      id: Math.random().toString(36).substring(2, 9),
      patientId,
      ...vitals,
      timestamp: new Date().toISOString()
    };

    const current = await this.getQueuedVitals();
    current.push(record);
    localStorage.setItem('halkyone_offline_vitals', JSON.stringify(current));
  }

  public async getQueuedVitals(): Promise<QueuedVitals[]> {
    const raw = localStorage.getItem('halkyone_offline_vitals');
    return raw ? JSON.parse(raw) : [];
  }

  public async clearVitals(id: string): Promise<void> {
    const current = await this.getQueuedVitals();
    const updated = current.filter(v => v.id !== id);
    localStorage.setItem('halkyone_offline_vitals', JSON.stringify(updated));
  }

  // ESAS Assessments Caching
  public async queueEsas(patientId: string, esas: Omit<QueuedEsas, 'id' | 'patientId' | 'timestamp'>): Promise<void> {
    const record: QueuedEsas = {
      id: Math.random().toString(36).substring(2, 9),
      patientId,
      ...esas,
      timestamp: new Date().toISOString()
    };

    const current = await this.getQueuedEsas();
    current.push(record);
    localStorage.setItem('halkyone_offline_esas', JSON.stringify(current));
  }

  public async getQueuedEsas(): Promise<QueuedEsas[]> {
    const raw = localStorage.getItem('halkyone_offline_esas');
    return raw ? JSON.parse(raw) : [];
  }

  public async clearEsas(id: string): Promise<void> {
    const current = await this.getQueuedEsas();
    const updated = current.filter(e => e.id !== id);
    localStorage.setItem('halkyone_offline_esas', JSON.stringify(updated));
  }

  // Global Sync Helper
  public async hasUnsyncedData(): Promise<boolean> {
    const vitals = await this.getQueuedVitals();
    const esas = await this.getQueuedEsas();
    return vitals.length > 0 || esas.length > 0;
  }
}

export const SqliteCacheService = new SqliteCacheServiceImpl();
