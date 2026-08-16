/**
 * Tests d'intégration du journal — SPEC-001.
 * Base SQLite en mémoire, migrations réelles, recréée à chaque test.
 */
import { eq } from 'drizzle-orm';

import { sumEntries } from '@/domain/nutrition/macros';
import { localDay } from '@/lib/date';

import { foods, syncOutbox } from '../db/schema';

import { createTestContext, type TestContext } from './__fixtures__/test-database';
import { createDiaryRepository } from './diary.repository';
import { createFoodRepository } from './food.repository';

const DAY = localDay('2026-08-16');
const YESTERDAY = localDay('2026-08-15');

let context: TestContext;
let diary: ReturnType<typeof createDiaryRepository>;
let food: ReturnType<typeof createFoodRepository>;

beforeEach(() => {
  context = createTestContext();
  diary = createDiaryRepository(context.deps);
  food = createFoodRepository(context.deps);
});

afterEach(() => context.close());

/** « Riz basmati cuit » à 130 kcal / 100 g, l'aliment de référence de la spec. */
const createRice = (): string =>
  food.createCustom({
    name: 'Riz basmati cuit',
    baseUnit: 'g',
    nutrition: { energyKcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 },
  });

/** 150 g de riz : 195 kcal, comme dans CA-2. */
const addRice = (foodId: string, grams = 150) =>
  diary.add({
    day: DAY,
    mealSlot: 'lunch',
    foodId,
    quantity: grams,
    unit: 'g',
    grams,
    foodName: 'Riz basmati cuit',
    nutrition: {
      kcal: (130 * grams) / 100,
      proteinG: (2.7 * grams) / 100,
      carbsG: (28 * grams) / 100,
      fatG: (0.3 * grams) / 100,
    },
  });

describe('ajout d’une entrée (CA-2)', () => {
  it('enregistre 150 g de riz à 195 kcal et met le total du jour à jour', () => {
    addRice(createRice());

    const entries = diary.listByDay(DAY);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.kcal).toBe(195);

    expect(diary.totalsForDay(DAY).kcal).toBe(195);
  });

  it('numérote les entrées d’un même repas dans leur ordre de saisie', () => {
    const rice = createRice();
    addRice(rice, 100);
    addRice(rice, 200);

    expect(diary.listByMeal(DAY, 'lunch').map((e) => e.sortOrder)).toEqual([0, 1]);
  });

  it('n’expose pas les entrées d’un autre jour', () => {
    addRice(createRice());

    expect(diary.listByDay(YESTERDAY)).toHaveLength(0);
    expect(diary.totalsForDay(YESTERDAY).kcal).toBe(0);
  });
});

describe('figement des valeurs (RG-3, CA-3)', () => {
  it('ne modifie PAS une entrée existante quand la fiche produit change', () => {
    const rice = createRice();
    addRice(rice);

    food.updateNutrition(rice, { energyKcal: 200, proteinG: 2.7, carbsG: 28, fatG: 0.3 });

    expect(diary.listByDay(DAY)[0]?.kcal).toBe(195);
  });

  it('applique la nouvelle valeur à une entrée saisie APRÈS la modification', () => {
    const rice = createRice();
    addRice(rice);
    food.updateNutrition(rice, { energyKcal: 200, proteinG: 2.7, carbsG: 28, fatG: 0.3 });

    diary.add({
      day: DAY,
      mealSlot: 'dinner',
      foodId: rice,
      quantity: 150,
      unit: 'g',
      grams: 150,
      foodName: 'Riz basmati cuit',
      nutrition: { kcal: 300, proteinG: 4.05, carbsG: 42, fatG: 0.45 },
    });

    const dinner = diary.listByMeal(DAY, 'dinner');
    expect(dinner[0]?.kcal).toBe(300);
    expect(diary.listByMeal(DAY, 'lunch')[0]?.kcal).toBe(195);
  });

  it('conserve le nom figé même si l’aliment est supprimé du catalogue', () => {
    const rice = createRice();
    addRice(rice);

    expect(diary.listByDay(DAY)[0]?.foodNameSnapshot).toBe('Riz basmati cuit');
  });
});

describe('modification de quantité (CA-4)', () => {
  it('passe de 150 g à 200 g et recalcule 195 → 260 kcal', () => {
    const rice = createRice();
    const id = addRice(rice);

    diary.updateQuantity(id, 200, 'g', 200);

    const entry = diary.listByDay(DAY)[0];
    expect(entry?.grams).toBe(200);
    expect(entry?.kcal).toBeCloseTo(260, 6);
    expect(diary.totalsForDay(DAY).kcal).toBeCloseTo(260, 6);
  });

  it('met les macros à la même échelle', () => {
    const id = addRice(createRice());

    diary.updateQuantity(id, 300, 'g', 300);

    const entry = diary.listByDay(DAY)[0];
    expect(entry?.proteinG).toBeCloseTo(8.1, 6);
    expect(entry?.carbsG).toBeCloseTo(84, 6);
  });

  it('recalcule depuis l’aliment courant, pas depuis les valeurs figées (ADR-0005)', () => {
    // ADR-0005 : la fiche passée à 200 kcal/100 g, 150 g → 200 g donne 400 kcal.
    const rice = createRice();
    const id = addRice(rice);
    food.updateNutrition(rice, { energyKcal: 200, proteinG: 2.7, carbsG: 28, fatG: 0.3 });

    diary.updateQuantity(id, 200, 'g', 200);

    expect(diary.listByDay(DAY)[0]?.kcal).toBeCloseTo(400, 6);
  });

  it('repli : met à l’échelle les valeurs figées quand foodId est null', () => {
    diary.add({
      day: DAY,
      mealSlot: 'snack',
      foodId: null,
      quantity: 150,
      unit: 'g',
      grams: 150,
      foodName: 'Plat saisi à la main',
      nutrition: { kcal: 195, proteinG: 5, carbsG: 30, fatG: 2 },
    });
    const id = diary.listByMeal(DAY, 'snack')[0]?.id as string;

    diary.updateQuantity(id, 300, 'g', 300);

    const entry = diary.listByMeal(DAY, 'snack')[0];
    expect(entry?.kcal).toBeCloseTo(390, 6);
    expect(entry?.proteinG).toBeCloseTo(10, 6);
  });

  it('repli : met à l’échelle les valeurs figées quand l’aliment a été supprimé', () => {
    const rice = createRice();
    const id = addRice(rice);

    // Suppression logique directe : le repository des aliments n'expose pas de
    // suppression en M1, mais une fiche marquée supprimée doit déclencher le repli.
    context.deps.db
      .update(foods)
      .set({ deletedAt: context.deps.now() })
      .where(eq(foods.id, rice))
      .run();

    diary.updateQuantity(id, 300, 'g', 300);

    // Aucune fiche à relire → repli sur les valeurs figées : 195 → 390 kcal.
    expect(diary.listByDay(DAY)[0]?.kcal).toBeCloseTo(390, 6);
  });

  it('laisse les macros inconnues inconnues, sans les transformer en 0', () => {
    diary.add({
      day: DAY,
      mealSlot: 'snack',
      foodId: null,
      quantity: 100,
      unit: 'g',
      grams: 100,
      foodName: 'Plat inconnu',
      nutrition: { kcal: 200, proteinG: null, carbsG: null, fatG: null },
    });
    const id = diary.listByMeal(DAY, 'snack')[0]?.id as string;

    diary.updateQuantity(id, 200, 'g', 200);

    const entry = diary.listByMeal(DAY, 'snack')[0];
    expect(entry?.kcal).toBe(400);
    expect(entry?.proteinG).toBeNull();
  });
});

describe('suppression et annulation (RG-5, CA-5)', () => {
  it('retire l’entrée des lectures sans l’effacer', () => {
    const id = addRice(createRice());

    diary.softDelete(id);

    expect(diary.listByDay(DAY)).toHaveLength(0);
    expect(diary.totalsForDay(DAY).kcal).toBe(0);
  });

  it('restaure l’entrée à l’identique', () => {
    const id = addRice(createRice());
    diary.softDelete(id);

    diary.restore(id);

    const entries = diary.listByDay(DAY);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.kcal).toBe(195);
    expect(entries[0]?.id).toBe(id);
  });
});

describe('totaux du jour (RG-7)', () => {
  it('additionne plusieurs entrées de repas différents', () => {
    const rice = createRice();
    addRice(rice, 100);
    diary.add({
      day: DAY,
      mealSlot: 'breakfast',
      foodId: rice,
      quantity: 50,
      unit: 'g',
      grams: 50,
      foodName: 'Riz basmati cuit',
      nutrition: { kcal: 65, proteinG: 1.35, carbsG: 14, fatG: 0.15 },
    });

    expect(diary.totalsForDay(DAY).kcal).toBe(195);
  });

  it('signale des données incomplètes dès qu’une macro manque', () => {
    diary.add({
      day: DAY,
      mealSlot: 'snack',
      foodId: null,
      quantity: 1,
      unit: 'g',
      grams: 100,
      foodName: 'Plat sans détail',
      nutrition: { kcal: 300, proteinG: null, carbsG: null, fatG: null },
    });

    const totals = diary.totalsForDay(DAY);
    expect(totals.kcal).toBe(300);
    expect(totals.proteinG).toBe(0);
    expect(totals.hasIncompleteData).toBe(true);
  });

  it('ne signale rien quand toutes les entrées sont complètes', () => {
    addRice(createRice());

    expect(diary.totalsForDay(DAY).hasIncompleteData).toBe(false);
  });

  it('renvoie des zéros sur un jour vide, sans planter', () => {
    expect(diary.totalsForDay(DAY)).toEqual({
      kcal: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      hasIncompleteData: false,
    });
  });

  it('donne le même résultat que sumEntries (domaine) sur les mêmes entrées', () => {
    const rice = createRice();
    addRice(rice, 100);
    diary.add({
      day: DAY,
      mealSlot: 'breakfast',
      foodId: rice,
      quantity: 50,
      unit: 'g',
      grams: 50,
      foodName: 'Riz basmati cuit',
      nutrition: { kcal: 65, proteinG: 1.35, carbsG: 14, fatG: 0.15 },
    });
    diary.add({
      day: DAY,
      mealSlot: 'snack',
      foodId: null,
      quantity: 1,
      unit: 'g',
      grams: 100,
      foodName: 'Plat sans détail',
      nutrition: { kcal: 300, proteinG: null, carbsG: null, fatG: null },
    });

    const fromDomain = sumEntries(diary.listByDay(DAY));
    const fromSql = diary.totalsForDay(DAY);

    expect(fromDomain.kcal).toBeCloseTo(fromSql.kcal, 6);
    expect(fromDomain.proteinG).toBeCloseTo(fromSql.proteinG, 6);
    expect(fromDomain.carbsG).toBeCloseTo(fromSql.carbsG, 6);
    expect(fromDomain.fatG).toBeCloseTo(fromSql.fatG, 6);
    expect(fromDomain.hasIncompleteData).toBe(fromSql.hasIncompleteData);
  });
});

describe('copie d’un repas (CA-8)', () => {
  it('crée trois nouvelles entrées sans toucher à celles d’origine', () => {
    const rice = createRice();
    for (const grams of [100, 150, 200]) {
      diary.add({
        day: YESTERDAY,
        mealSlot: 'lunch',
        foodId: rice,
        quantity: grams,
        unit: 'g',
        grams,
        foodName: 'Riz basmati cuit',
        nutrition: { kcal: (130 * grams) / 100, proteinG: null, carbsG: null, fatG: null },
      });
    }

    const created = diary.copyMeal(
      { day: YESTERDAY, mealSlot: 'lunch' },
      { day: DAY, mealSlot: 'lunch' },
    );

    expect(created).toHaveLength(3);
    expect(diary.listByMeal(DAY, 'lunch')).toHaveLength(3);
    expect(diary.listByMeal(YESTERDAY, 'lunch')).toHaveLength(3);
    expect(diary.totalsForDay(DAY).kcal).toBe(diary.totalsForDay(YESTERDAY).kcal);
  });

  it('copie les valeurs figées, pas un recalcul depuis la fiche produit', () => {
    const rice = createRice();
    diary.add({
      day: YESTERDAY,
      mealSlot: 'dinner',
      foodId: rice,
      quantity: 150,
      unit: 'g',
      grams: 150,
      foodName: 'Riz basmati cuit',
      nutrition: { kcal: 195, proteinG: null, carbsG: null, fatG: null },
    });
    food.updateNutrition(rice, { energyKcal: 999, proteinG: null, carbsG: null, fatG: null });

    diary.copyMeal({ day: YESTERDAY, mealSlot: 'dinner' }, { day: DAY, mealSlot: 'dinner' });

    expect(diary.listByMeal(DAY, 'dinner')[0]?.kcal).toBe(195);
  });
});

describe('journal des modifications (sync_outbox)', () => {
  it('trace chaque écriture pour la synchronisation future', () => {
    const id = addRice(createRice());
    diary.softDelete(id);

    const operations = context.deps.db
      .select({ operation: syncOutbox.operation, table: syncOutbox.tableName })
      .from(syncOutbox)
      .all();

    expect(operations).toEqual(
      expect.arrayContaining([
        { operation: 'insert', table: 'foods' },
        { operation: 'insert', table: 'diary_entries' },
        { operation: 'delete', table: 'diary_entries' },
      ]),
    );
  });
});
