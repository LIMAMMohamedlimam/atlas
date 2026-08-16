/**
 * Tests d'intégration des mesures corporelles — SPEC-003 RG-12.
 */
import { localDay } from '@/lib/date';

import { createTestContext, type TestContext } from './__fixtures__/test-database';
import { createBodyMeasurementsRepository } from './body-measurements.repository';

let context: TestContext;
let measurements: ReturnType<typeof createBodyMeasurementsRepository>;

beforeEach(() => {
  context = createTestContext();
  measurements = createBodyMeasurementsRepository(context.deps);
});

afterEach(() => context.close());

describe('mesures corporelles', () => {
  it('renvoie undefined avant toute pesée', () => {
    expect(measurements.getLatest()).toBeUndefined();
  });

  it('enregistre une pesée et la relit comme poids courant', () => {
    measurements.save({ day: localDay('2026-08-16'), weightKg: 80 });

    expect(measurements.getLatest()?.weightKg).toBe(80);
  });

  it('remplace la mesure du même jour (une seule par jour)', () => {
    measurements.save({ day: localDay('2026-08-16'), weightKg: 80 });
    measurements.save({ day: localDay('2026-08-16'), weightKg: 79 });

    expect(measurements.getLatest()?.weightKg).toBe(79);
  });

  it('getLatest renvoie la mesure du jour le plus récent', () => {
    measurements.save({ day: localDay('2026-08-15'), weightKg: 81 });
    measurements.save({ day: localDay('2026-08-16'), weightKg: 80 });

    expect(measurements.getLatest()?.day).toBe('2026-08-16');
  });
});
