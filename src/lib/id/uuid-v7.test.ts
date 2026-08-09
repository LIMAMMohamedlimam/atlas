import { isUuidV7, timestampOfUuidV7, uuidV7, type RandomBytes } from './uuid-v7';

/** Aléa déterministe, pour que les tests soient reproductibles. */
const fixedRandom: RandomBytes = (length) =>
  Uint8Array.from({ length }, (_, i) => (i * 37 + 11) % 256);

describe('uuidV7', () => {
  it('produit un identifiant au format attendu', () => {
    const id = uuidV7(fixedRandom, 1_754_769_000_000);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(isUuidV7(id)).toBe(true);
  });

  it('encode la version 7 et la variante RFC 4122', () => {
    const id = uuidV7(fixedRandom, 1_754_769_000_000);
    expect(id[14]).toBe('7');
    expect(['8', '9', 'a', 'b']).toContain(id[19]);
  });

  it("permet de retrouver l'horodatage de création", () => {
    const now = 1_754_769_000_000;
    expect(timestampOfUuidV7(uuidV7(fixedRandom, now))).toBe(now);
  });

  // C'est la propriété qui justifie v7 plutôt que v4.
  it('se trie par date de création en ordre lexicographique', () => {
    const early = uuidV7(fixedRandom, 1_700_000_000_000);
    const middle = uuidV7(fixedRandom, 1_754_769_000_000);
    const late = uuidV7(fixedRandom, 1_800_000_000_000);
    expect([late, early, middle].sort()).toEqual([early, middle, late]);
  });

  it('produit des identifiants distincts au même horodatage', () => {
    let seed = 0;
    const varyingRandom: RandomBytes = (length) => {
      seed += 1;
      return Uint8Array.from({ length }, (_, i) => (i * 31 + seed * 7) % 256);
    };
    const a = uuidV7(varyingRandom, 1_754_769_000_000);
    const b = uuidV7(varyingRandom, 1_754_769_000_000);
    expect(a).not.toBe(b);
  });

  it('refuse un horodatage invalide', () => {
    expect(() => uuidV7(fixedRandom, -1)).toThrow(RangeError);
    expect(() => uuidV7(fixedRandom, 1.5)).toThrow(RangeError);
  });

  it("utilise l'horloge courante quand aucun horodatage n'est fourni", () => {
    const before = Date.now();
    const id = uuidV7(fixedRandom);
    expect(isUuidV7(id)).toBe(true);
    expect(timestampOfUuidV7(id)).toBeGreaterThanOrEqual(before);
    expect(timestampOfUuidV7(id)).toBeLessThanOrEqual(Date.now());
  });

  it('rembourre les octets nuls sur deux chiffres hexadécimaux', () => {
    const zeroRandom: RandomBytes = (length) => new Uint8Array(length);
    const id = uuidV7(zeroRandom, 0);
    expect(id).toBe('00000000-0000-7000-8000-000000000000');
  });
});

describe('timestampOfUuidV7', () => {
  it('refuse une chaîne qui n’est pas un UUIDv7', () => {
    expect(() => timestampOfUuidV7('pas-un-uuid')).toThrow(RangeError);
  });
});

describe('isUuidV7', () => {
  it('rejette un UUIDv4', () => {
    expect(isUuidV7('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d')).toBe(false);
  });
});
