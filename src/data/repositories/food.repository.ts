/**
 * Aliments — partie M1 uniquement : création manuelle et lecture.
 *
 * La recherche en ligne, le scan et les portions nommées arrivent en M2 avec
 * SPEC-002. Ce fichier grandira, il ne sera pas remplacé.
 */
import { and, eq, isNull, sql } from 'drizzle-orm';

import { foods } from '../db/schema';

import { recordChange, type RepositoryDeps } from './shared';

export type NutritionPer100 = {
  readonly energyKcal: number;
  readonly proteinG?: number | null;
  readonly carbsG?: number | null;
  readonly fatG?: number | null;
  readonly sugarsG?: number | null;
  readonly saturatedFatG?: number | null;
  readonly fiberG?: number | null;
  readonly saltG?: number | null;
};

export type CreateCustomFoodInput = {
  readonly name: string;
  readonly brand?: string | null;
  readonly baseUnit: 'g' | 'ml';
  readonly nutrition: NutritionPer100;
};

/** Vue d'un aliment : uniquement les colonnes dont M1 se sert (pas de `SELECT *`). */
export type FoodRecord = {
  readonly id: string;
  readonly name: string;
  readonly brand: string | null;
  readonly baseUnit: 'g' | 'ml';
  readonly energyKcal: number;
  readonly proteinG: number | null;
  readonly carbsG: number | null;
  readonly fatG: number | null;
  readonly sugarsG: number | null;
  readonly saturatedFatG: number | null;
  readonly fiberG: number | null;
  readonly saltG: number | null;
};

const FOOD_COLUMNS = {
  id: foods.id,
  name: foods.name,
  brand: foods.brand,
  baseUnit: foods.baseUnit,
  energyKcal: foods.energyKcal,
  proteinG: foods.proteinG,
  carbsG: foods.carbsG,
  fatG: foods.fatG,
  sugarsG: foods.sugarsG,
  saturatedFatG: foods.saturatedFatG,
  fiberG: foods.fiberG,
  saltG: foods.saltG,
} as const;

export const createFoodRepository = (deps: RepositoryDeps) => ({
  /**
   * Crée un aliment personnel. Les valeurs sont POUR 100 g ou 100 ml.
   * Une valeur absente reste `null` : on n'invente jamais un chiffre.
   */
  createCustom(input: CreateCustomFoodInput): string {
    const id = deps.newId();
    const timestamp = deps.now();

    deps.db
      .insert(foods)
      .values({
        id,
        source: 'custom',
        name: input.name,
        brand: input.brand ?? null,
        baseUnit: input.baseUnit,
        energyKcal: input.nutrition.energyKcal,
        proteinG: input.nutrition.proteinG ?? null,
        carbsG: input.nutrition.carbsG ?? null,
        fatG: input.nutrition.fatG ?? null,
        sugarsG: input.nutrition.sugarsG ?? null,
        saturatedFatG: input.nutrition.saturatedFatG ?? null,
        fiberG: input.nutrition.fiberG ?? null,
        saltG: input.nutrition.saltG ?? null,
        isVerified: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .run();

    recordChange(deps, 'foods', id, 'insert');
    return id;
  },

  getById(id: string): FoodRecord | undefined {
    const [row] = deps.db
      .select(FOOD_COLUMNS)
      .from(foods)
      .where(and(eq(foods.id, id), isNull(foods.deletedAt)))
      .limit(1)
      .all();

    return row;
  },

  /** Met à jour les valeurs d'un aliment. N'affecte AUCUNE entrée déjà saisie (RG-3). */
  updateNutrition(id: string, nutrition: NutritionPer100): void {
    deps.db
      .update(foods)
      .set({
        energyKcal: nutrition.energyKcal,
        proteinG: nutrition.proteinG ?? null,
        carbsG: nutrition.carbsG ?? null,
        fatG: nutrition.fatG ?? null,
        updatedAt: deps.now(),
      })
      .where(eq(foods.id, id))
      .run();

    recordChange(deps, 'foods', id, 'update');
  },

  /** Alimente « Fréquents » et « Récents » (dénormalisation assumée). */
  markUsed(id: string): void {
    const timestamp = deps.now();
    deps.db
      .update(foods)
      .set({
        lastUsedAt: timestamp,
        useCount: sql`${foods.useCount} + 1`,
        updatedAt: timestamp,
      })
      .where(eq(foods.id, id))
      .run();
  },
});

export type FoodRepository = ReturnType<typeof createFoodRepository>;
