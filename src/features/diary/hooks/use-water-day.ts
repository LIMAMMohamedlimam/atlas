import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { waterRepository } from '@/data/repositories';
import type { LocalDay } from '@/lib/date';

export type WaterDayResult =
  | { readonly state: 'loading' }
  | { readonly state: 'error'; readonly error: Error }
  | { readonly state: 'ready'; readonly totalMl: number };

/** Suivi de l'eau d'un jour (RG-10), via live query sur `water_logs`. */
export const useWaterDay = (day: LocalDay): WaterDayResult => {
  const { data, error, updatedAt } = useLiveQuery(waterRepository.listByDayQuery(day), [day]);

  if (error) return { state: 'error', error };
  if (updatedAt === undefined) return { state: 'loading' };

  let totalMl = 0;
  for (const log of data) totalMl += log.amountMl;

  return { state: 'ready', totalMl };
};
