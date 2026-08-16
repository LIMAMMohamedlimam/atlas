import { renderHook } from '@testing-library/react-native';

import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { diaryRepository, nutritionTargetsRepository } from '@/data/repositories';
import type { DiaryEntryRecord, MealSlot } from '@/data/repositories/diary.repository';
import type { TargetRecord } from '@/data/repositories/nutrition-targets.repository';
import { localDay } from '@/lib/date';

import { useDiaryDay } from './use-diary-day';

jest.mock('drizzle-orm/expo-sqlite', () => ({
  useLiveQuery: jest.fn(),
}));

jest.mock('@/data/repositories', () => ({
  diaryRepository: { listByDayQuery: jest.fn(() => ({})) },
  nutritionTargetsRepository: { forDay: jest.fn() },
}));

// Mocks assouplis : les tests renvoient des données de test sans reconstruire
// les types Drizzle exacts (`as unknown` réduit, puis assouplit, le type réel).
const useLiveQueryMock = useLiveQuery as unknown as jest.Mock;
const forDayMock = nutritionTargetsRepository.forDay as unknown as jest.Mock;
const listByDayQueryMock = diaryRepository.listByDayQuery as unknown as jest.Mock;

const DAY = localDay('2026-08-16');

const makeEntry = (
  id: string,
  mealSlot: MealSlot,
  overrides: Partial<DiaryEntryRecord> = {},
): DiaryEntryRecord => ({
  id,
  day: DAY,
  mealSlot,
  sortOrder: 0,
  foodId: null,
  quantity: 150,
  unit: 'g',
  grams: 150,
  foodNameSnapshot: 'Riz basmati cuit',
  foodBrandSnapshot: null,
  kcal: 195,
  proteinG: 4.05,
  carbsG: 42,
  fatG: 0.45,
  ...overrides,
});

const target = (): TargetRecord => ({
  id: 't1',
  effectiveFrom: DAY,
  kcal: 2400,
  proteinG: 150,
  carbsG: 300,
  fatG: 70,
  fiberG: null,
  waterMl: null,
  method: 'manual',
  belowSafetyFloor: 0,
});

beforeEach(() => {
  jest.clearAllMocks();
  useLiveQueryMock.mockReturnValue({ data: [], error: undefined, updatedAt: new Date() });
  forDayMock.mockReturnValue(undefined);
});

describe('useDiaryDay', () => {
  it('est en chargement tant que la première lecture n’est pas résolue', async () => {
    useLiveQueryMock.mockReturnValue({ data: [], error: undefined, updatedAt: undefined });

    const { result } = await renderHook(() => useDiaryDay(DAY));

    expect(result.current).toEqual({ state: 'loading' });
  });

  it('remonte l’erreur de la live query', async () => {
    const boom = new Error('boom');
    useLiveQueryMock.mockReturnValue({ data: [], error: boom, updatedAt: new Date() });

    const { result } = await renderHook(() => useDiaryDay(DAY));

    expect(result.current).toEqual({ state: 'error', error: boom });
  });

  it('interroge la table diary_entries pour le jour demandé, sans agrégat SQL', async () => {
    await renderHook(() => useDiaryDay(DAY));

    expect(listByDayQueryMock).toHaveBeenCalledWith(DAY);
  });

  it('groupe les entrées par créneau, dans l’ordre d’affichage', async () => {
    useLiveQueryMock.mockReturnValue({
      data: [
        makeEntry('1', 'lunch'),
        makeEntry('2', 'breakfast'),
        makeEntry('3', 'lunch'),
        makeEntry('4', 'snack'),
      ],
      error: undefined,
      updatedAt: new Date(),
    });

    const { result } = await renderHook(() => useDiaryDay(DAY));

    expect(result.current.state).toBe('ready');
    if (result.current.state !== 'ready') return;

    expect(result.current.meals.map((meal) => meal.mealSlot)).toEqual([
      'breakfast',
      'lunch',
      'dinner',
      'snack',
    ]);
    expect(result.current.meals[1]?.entries.map((entry) => entry.id)).toEqual(['1', '3']);
  });

  it('calcule les totaux via sumEntries, y compris le sous-total par créneau', async () => {
    useLiveQueryMock.mockReturnValue({
      data: [makeEntry('1', 'lunch'), makeEntry('2', 'lunch')],
      error: undefined,
      updatedAt: new Date(),
    });

    const { result } = await renderHook(() => useDiaryDay(DAY));

    expect(result.current.state).toBe('ready');
    if (result.current.state !== 'ready') return;

    expect(result.current.totals.kcal).toBeCloseTo(390, 6);
    expect(result.current.meals[1]?.kcal).toBeCloseTo(390, 6);
  });

  it('signale des données incomplètes dès qu’une macro manque (RG-7)', async () => {
    useLiveQueryMock.mockReturnValue({
      data: [makeEntry('1', 'lunch', { proteinG: null, carbsG: null, fatG: null })],
      error: undefined,
      updatedAt: new Date(),
    });

    const { result } = await renderHook(() => useDiaryDay(DAY));

    expect(result.current.state).toBe('ready');
    if (result.current.state !== 'ready') return;

    expect(result.current.totals.hasIncompleteData).toBe(true);
    expect(result.current.totals.proteinG).toBe(0);
  });

  it('lit l’objectif en vigueur pour le jour demandé (RG-8)', async () => {
    const goal = target();
    forDayMock.mockReturnValue(goal);

    const { result } = await renderHook(() => useDiaryDay(DAY));

    expect(result.current.state).toBe('ready');
    if (result.current.state !== 'ready') return;

    expect(result.current.target).toBe(goal);
    expect(forDayMock).toHaveBeenCalledWith(DAY);
  });

  it('renvoie target indéfini quand aucun objectif n’est encore défini', async () => {
    const { result } = await renderHook(() => useDiaryDay(DAY));

    expect(result.current.state).toBe('ready');
    if (result.current.state !== 'ready') return;

    expect(result.current.target).toBeUndefined();
  });
});
