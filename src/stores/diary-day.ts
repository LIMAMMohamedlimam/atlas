/**
 * Jour affiché dans le journal — état UI éphémère (ADR-0004).
 *
 * Le jour est une simple valeur d'affichage : il ne survit pas à la fermeture de
 * l'app et n'a pas sa place en base. Un store ne contient jamais d'entité
 * persistée (ADR-0004:65) — ici, uniquement un `LocalDay`.
 */
import { create } from 'zustand';

import { todayLocalDay, type LocalDay } from '@/lib/date';

type DiaryDayStore = {
  readonly day: LocalDay;
  readonly setDay: (day: LocalDay) => void;
  readonly goToToday: () => void;
};

export const useDiaryDayStore = create<DiaryDayStore>((set) => ({
  day: todayLocalDay(),
  setDay: (day) => set({ day }),
  goToToday: () => set({ day: todayLocalDay() }),
}));
