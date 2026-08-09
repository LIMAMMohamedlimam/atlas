import {
  centimeters,
  cmToInch,
  gToOz,
  grams,
  inchToCm,
  kcalToKj,
  kgToLb,
  kilocalories,
  kilograms,
  kjToKcal,
  lbToKg,
  milliliters,
  ozToG,
  roundTo,
  saltGToSodiumMg,
  sodiumMgToSaltG,
} from './index';

describe('conversions de masse', () => {
  it('convertit kg vers lb', () => {
    expect(kgToLb(kilograms(80))).toBeCloseTo(176.37, 2);
  });

  it('ne dérive pas sur un aller-retour kg → lb → kg', () => {
    const start = kilograms(78.4);
    expect(lbToKg(kgToLb(start))).toBeCloseTo(78.4, 10);
  });

  it('ne dérive pas sur un aller-retour g → oz → g', () => {
    const start = grams(150);
    expect(ozToG(gToOz(start))).toBeCloseTo(150, 10);
  });
});

describe('conversions de longueur', () => {
  it('convertit cm vers pouces', () => {
    expect(cmToInch(centimeters(180))).toBeCloseTo(70.866, 3);
  });

  it('ne dérive pas sur un aller-retour', () => {
    expect(inchToCm(cmToInch(centimeters(180)))).toBeCloseTo(180, 10);
  });
});

describe('conversions nutritionnelles', () => {
  // docs/architecture/food-data-pipeline.md : OFF fournit parfois l'énergie en kJ seulement.
  it('convertit les kilojoules en kilocalories', () => {
    expect(kjToKcal(2000)).toBeCloseTo(478.01, 2);
  });

  it('convertit les kilocalories en kilojoules', () => {
    expect(kcalToKj(kilocalories(100))).toBeCloseTo(418.4, 4);
  });

  // SPEC-002 RG-13 : sel = sodium × 2,5
  it('convertit le sodium en sel', () => {
    expect(sodiumMgToSaltG(400)).toBeCloseTo(1, 10);
  });

  it('ne dérive pas sur un aller-retour sodium → sel → sodium', () => {
    expect(saltGToSodiumMg(sodiumMgToSaltG(400))).toBeCloseTo(400, 10);
  });

  it('expose les constructeurs de types nommés', () => {
    expect(milliliters(250)).toBe(250);
    expect(kilocalories(2400)).toBe(2400);
  });
});

describe('roundTo', () => {
  it('arrondit au nombre de décimales demandé', () => {
    expect(roundTo(432.4567, 1)).toBe(432.5);
    expect(roundTo(432.4567, 0)).toBe(432);
  });

  it("illustre pourquoi on n'arrondit pas avant de sommer", () => {
    const raw = [33.333, 33.333, 33.333];
    const roundedThenSummed = raw.reduce((acc, v) => acc + roundTo(v, 0), 0);
    const summedThenRounded = roundTo(
      raw.reduce((acc, v) => acc + v, 0),
      0,
    );
    expect(roundedThenSummed).toBe(99);
    expect(summedThenRounded).toBe(100);
  });
});
