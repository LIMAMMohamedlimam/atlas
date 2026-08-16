/**
 * Tests d'intégration des objectifs historisés — SPEC-003 RG-10/RG-11, SPEC-001 RG-8.
 */
import { localDay } from '@/lib/date';

import { createTestContext, type TestContext } from './__fixtures__/test-database';
import { createNutritionTargetsRepository } from './nutrition-targets.repository';

let context: TestContext;
let targets: ReturnType<typeof createNutritionTargetsRepository>;

beforeEach(() => {
  context = createTestContext();
  targets = createNutritionTargetsRepository(context.deps);
});

afterEach(() => context.close());

const saveTarget = (effectiveFrom: string, kcal: number) =>
  targets.save({
    effectiveFrom: localDay(effectiveFrom),
    kcal,
    proteinG: 180,
    carbsG: 260,
    fatG: 70,
    method: 'calculated',
  });

describe('objectif applicable à une date (RG-8, CA-6)', () => {
  beforeEach(() => {
    saveTarget('2026-07-01', 2400);
    context.tick();
    saveTarget('2026-08-16', 2700);
  });

  it('applique le nouvel objectif au jour du changement', () => {
    expect(targets.forDay(localDay('2026-08-16'))?.kcal).toBe(2700);
  });

  it('laisse les jours passés sur leur objectif d’époque', () => {
    expect(targets.forDay(localDay('2026-07-15'))?.kcal).toBe(2400);
  });

  it('applique le nouvel objectif aux jours suivants', () => {
    expect(targets.forDay(localDay('2026-09-01'))?.kcal).toBe(2700);
  });

  it('ne renvoie rien avant le tout premier objectif', () => {
    expect(targets.forDay(localDay('2026-06-30'))).toBeUndefined();
  });

  it('prend effet le jour même, jamais rétroactivement (RG-11)', () => {
    // La veille du changement doit encore voir l'ancien objectif.
    expect(targets.forDay(localDay('2026-08-15'))?.kcal).toBe(2400);
  });
});

describe('plusieurs objectifs le même jour', () => {
  it('retient le dernier enregistré', () => {
    saveTarget('2026-08-16', 2400);
    context.tick();
    saveTarget('2026-08-16', 2600);

    expect(targets.forDay(localDay('2026-08-16'))?.kcal).toBe(2600);
  });
});

describe('suppression logique', () => {
  it('fait retomber sur l’objectif précédent', () => {
    saveTarget('2026-07-01', 2400);
    context.tick();
    const recent = saveTarget('2026-08-16', 2700);

    targets.softDelete(recent);

    expect(targets.forDay(localDay('2026-08-16'))?.kcal).toBe(2400);
  });
});

describe('traçabilité du calcul (RG-4)', () => {
  it('conserve BMR, TDEE et le forçage sous le plancher de sécurité', () => {
    targets.save({
      effectiveFrom: localDay('2026-08-16'),
      kcal: 1100,
      proteinG: 150,
      carbsG: 80,
      fatG: 40,
      method: 'manual',
      calcBmr: 1400,
      calcTdee: 1680,
      calcAdjustmentPct: -0.2,
      belowSafetyFloor: true,
    });

    const target = targets.forDay(localDay('2026-08-16'));
    expect(target?.method).toBe('manual');
    expect(target?.belowSafetyFloor).toBe(1);
  });

  it('marque les objectifs sûrs comme non forcés', () => {
    saveTarget('2026-08-16', 2400);

    expect(targets.forDay(localDay('2026-08-16'))?.belowSafetyFloor).toBe(0);
  });
});

describe('journal vide', () => {
  it('renvoie undefined quand aucun objectif n’a jamais été défini', () => {
    expect(targets.current(localDay('2026-08-16'))).toBeUndefined();
  });
});
