import { useCallback } from 'react';

import { appSettingsRepository, waterRepository } from '@/data/repositories';
import type { LocalDay } from '@/lib/date';

/** Incrément d'eau par défaut (ml), surchargeable par le réglage `water.incrementMl`. */
export const DEFAULT_WATER_INCREMENT_ML = 250;

const WATER_INCREMENT_KEY = 'water.incrementMl';

/** Incrément configuré, ou 250 ml par défaut. */
export const readWaterIncrementMl = (): number =>
  appSettingsRepository.getJson<number>(WATER_INCREMENT_KEY) ?? DEFAULT_WATER_INCREMENT_ML;

/** Écriture du suivi de l'eau : ajoute un log du jour. */
export const useAddWater = () =>
  useCallback((day: LocalDay, amountMl: number): string => waterRepository.add(day, amountMl), []);
