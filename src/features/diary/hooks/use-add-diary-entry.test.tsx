import { renderHook } from '@testing-library/react-native';

import { diaryRepository } from '@/data/repositories';
import type { FoodRecord } from '@/data/repositories/food.repository';
import { localDay } from '@/lib/date';

import { useAddDiaryEntry } from './use-add-diary-entry';

jest.mock('@/data/repositories', () => ({
  diaryRepository: { add: jest.fn() },
}));

const addMock = diaryRepository.add as unknown as jest.Mock;

const DAY = localDay('2026-08-16');

const rice: FoodRecord = {
  id: 'f1',
  name: 'Riz basmati cuit',
  brand: null,
  baseUnit: 'g',
  energyKcal: 130,
  proteinG: 2.7,
  carbsG: 28,
  fatG: 0.3,
  sugarsG: null,
  saturatedFatG: null,
  fiberG: null,
  saltG: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  addMock.mockReturnValue('entry-1');
});

describe('useAddDiaryEntry', () => {
  it('construit le snapshot via le domaine puis fige l’entrée (ADR-0005)', async () => {
    const { result } = await renderHook(() => useAddDiaryEntry());

    const id = result.current({ day: DAY, mealSlot: 'lunch', food: rice, amount: 150, unit: 'g' });

    expect(id).toBe('entry-1');
    expect(addMock).toHaveBeenCalledTimes(1);

    const input = addMock.mock.calls[0]?.[0];
    expect(input.foodId).toBe('f1');
    expect(input.grams).toBe(150);
    expect(input.nutrition.kcal).toBeCloseTo(195, 6);
    expect(input.nutrition.proteinG).toBeCloseTo(4.05, 6);
    expect(input.nutrition.carbsG).toBe(42);
    expect(input.nutrition.fatG).toBeCloseTo(0.45, 6);
  });

  it('laisse une valeur source null à null dans le snapshot', async () => {
    const { result } = await renderHook(() => useAddDiaryEntry());

    result.current({ day: DAY, mealSlot: 'lunch', food: rice, amount: 150, unit: 'g' });

    const input = addMock.mock.calls[0]?.[0];
    expect(input.nutrition.sugarsG).toBeNull();
    expect(input.nutrition.saltG).toBeNull();
  });
});
