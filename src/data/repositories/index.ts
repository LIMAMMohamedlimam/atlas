/**
 * Instances uniques des repositories, câblées sur la VRAIE base (`src/data/db/client.ts`).
 *
 * Construites une seule fois au chargement du module : un hook ne recrée pas ses
 * `RepositoryDeps` à chaque rendu, et la génération d'identifiants / l'horloge
 * utilisent les socles réels (`expo-crypto`, `Date.now`).
 */
import { nowTimestamp } from '@/lib/date';
import { newId } from '@/lib/id';

import { db } from '../db/client';

import { createAppSettingsRepository } from './app-settings.repository';
import { createBodyMeasurementsRepository } from './body-measurements.repository';
import { createDiaryRepository } from './diary.repository';
import { createFoodRepository } from './food.repository';
import { createNutritionTargetsRepository } from './nutrition-targets.repository';
import { createUserProfileRepository } from './user-profile.repository';
import { createWaterRepository } from './water.repository';

const deps = { db, newId, now: nowTimestamp };

export const appSettingsRepository = createAppSettingsRepository(deps);
export const bodyMeasurementsRepository = createBodyMeasurementsRepository(deps);
export const diaryRepository = createDiaryRepository(deps);
export const foodRepository = createFoodRepository(deps);
export const nutritionTargetsRepository = createNutritionTargetsRepository(deps);
export const userProfileRepository = createUserProfileRepository(deps);
export const waterRepository = createWaterRepository(deps);
