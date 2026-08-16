import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { appSettingsRepository } from '@/data/repositories';

export const ONBOARDING_COMPLETED_KEY = 'onboarding.completed';

export type OnboardingStatus = { ready: boolean; complete: boolean };

/**
 * L'onboarding a-t-il été terminé ? Suivi via une live query sur `app_settings`,
 * pour que la racine de l'app réagisse à la fin de l'onboarding sans relecture.
 * Tant que la première lecture n'est pas résolue, on considère l'état « complet »
 * pour ne jamais faire clignoter l'onboarding à un utilisateur déjà configuré.
 */
export const useOnboardingStatus = (): OnboardingStatus => {
  const { data, updatedAt } = useLiveQuery(appSettingsRepository.listQuery(), []);

  if (updatedAt === undefined) return { ready: false, complete: true };

  const complete = data.some((row) => row.key === ONBOARDING_COMPLETED_KEY && row.value === 'true');
  return { ready: true, complete };
};
