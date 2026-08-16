/**
 * Tests d'intégration du suivi de l'eau — RG-10 SPEC-001.
 * Base SQLite en mémoire, migrations réelles, recréée à chaque test.
 */
import { localDay } from '@/lib/date';

import { createTestContext, type TestContext } from './__fixtures__/test-database';
import { createWaterRepository } from './water.repository';

const DAY = localDay('2026-08-16');

let context: TestContext;
let water: ReturnType<typeof createWaterRepository>;

beforeEach(() => {
  context = createTestContext();
  water = createWaterRepository(context.deps);
});

afterEach(() => context.close());

describe('suivi de l’eau (RG-10)', () => {
  it('ajoute des logs et totalise le jour en millilitres', () => {
    water.add(DAY, 250);
    water.add(DAY, 500);

    expect(water.listByDay(DAY)).toHaveLength(2);
    expect(water.totalForDay(DAY)).toBe(750);
  });

  it('ne mélange pas deux jours', () => {
    water.add(DAY, 250);
    water.add(localDay('2026-08-17'), 500);

    expect(water.totalForDay(DAY)).toBe(250);
  });

  it('renvoie 0 sur un jour vide', () => {
    expect(water.totalForDay(DAY)).toBe(0);
    expect(water.listByDay(DAY)).toHaveLength(0);
  });

  it('supprime logiquement puis restaure un log (CA-5)', () => {
    const id = water.add(DAY, 250);

    water.softDelete(id);
    expect(water.totalForDay(DAY)).toBe(0);

    water.restore(id);
    expect(water.totalForDay(DAY)).toBe(250);
  });
});
