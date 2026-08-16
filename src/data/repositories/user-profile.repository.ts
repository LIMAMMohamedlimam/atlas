/**
 * Profil utilisateur — UNE SEULE LIGNE (`id = 'singleton'`).
 *
 * Deux entorses aux conventions générales, actées dans data-model.md : pas
 * d'UUIDv7 (une ligne unique n'a rien à trier ni fusionner) et pas de
 * `deleted_at` (aucun scénario ne supprime le profil ; « effacer mes données »
 * remet les colonnes à NULL, cf. `clear()`).
 */
import { eq } from 'drizzle-orm';

import type { ActivityLevel, GoalType, Sex } from '@/domain/nutrition/energy';

import { userProfile } from '../db/schema';

import { recordChange, type RepositoryDeps } from './shared';

const PROFILE_ID = 'singleton';

export type UserProfileRecord = {
  readonly birthYear: number | null;
  readonly sex: Sex | null;
  readonly heightCm: number | null;
  readonly activityLevel: ActivityLevel | null;
  readonly goalType: GoalType | null;
};

export type SaveProfileInput = {
  readonly birthYear: number | null;
  readonly sex: Sex | null;
  readonly heightCm: number | null;
  readonly activityLevel: ActivityLevel | null;
  readonly goalType: GoalType | null;
};

const PROFILE_COLUMNS = {
  birthYear: userProfile.birthYear,
  sex: userProfile.sex,
  heightCm: userProfile.heightCm,
  activityLevel: userProfile.activityLevel,
  goalType: userProfile.goalType,
} as const;

export const createUserProfileRepository = (deps: RepositoryDeps) => ({
  /** Profil courant, ou `undefined` avant la fin de l'onboarding. */
  get(): UserProfileRecord | undefined {
    const [row] = deps.db
      .select(PROFILE_COLUMNS)
      .from(userProfile)
      .where(eq(userProfile.id, PROFILE_ID))
      .limit(1)
      .all();

    return row;
  },

  /** Enregistre (ou écrase) le profil. CA-7 : jamais de profil stocké en saisie directe. */
  save(input: SaveProfileInput): void {
    const timestamp = deps.now();

    deps.db
      .insert(userProfile)
      .values({
        id: PROFILE_ID,
        birthYear: input.birthYear,
        sex: input.sex,
        heightCm: input.heightCm,
        activityLevel: input.activityLevel,
        goalType: input.goalType,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .onConflictDoUpdate({
        target: userProfile.id,
        set: {
          birthYear: input.birthYear,
          sex: input.sex,
          heightCm: input.heightCm,
          activityLevel: input.activityLevel,
          goalType: input.goalType,
          updatedAt: timestamp,
        },
      })
      .run();

    recordChange(deps, 'user_profile', PROFILE_ID, 'update');
  },

  /** « Effacer mes données personnelles » sans toucher au journal (data-model.md). */
  clear(): void {
    this.save({ birthYear: null, sex: null, heightCm: null, activityLevel: null, goalType: null });
  },
});

export type UserProfileRepository = ReturnType<typeof createUserProfileRepository>;
