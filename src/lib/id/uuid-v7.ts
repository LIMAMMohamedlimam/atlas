/**
 * Génération d'UUIDv7.
 *
 * Pourquoi v7 et pas v4 : un UUIDv7 commence par un horodatage 48 bits, donc il est
 * triable par date de création et se comporte bien comme clé d'index (insertions
 * quasi séquentielles). Un v4 purement aléatoire fragmente les index B-tree.
 *
 * Voir docs/architecture/local-first-et-sync.md
 *
 * Fonction pure : la source d'aléa est injectée, ce qui la rend testable sans
 * dépendance native. Le câblage se fait dans `./index.ts`.
 */

export type RandomBytes = (length: number) => Uint8Array;

const toHex = (byte: number): string => byte.toString(16).padStart(2, '0');

export const uuidV7 = (randomBytes: RandomBytes, timestampMs: number = Date.now()): string => {
  if (!Number.isInteger(timestampMs) || timestampMs < 0) {
    throw new RangeError(`Horodatage invalide : ${timestampMs}`);
  }

  const bytes = new Uint8Array(16);
  // On passe par un DataView : ses accesseurs renvoient un `number`, là où
  // l'indexation d'un tableau renvoie `number | undefined` sous
  // `noUncheckedIndexedAccess` et imposerait des replis morts, impossibles à tester.
  const view = new DataView(bytes.buffer);

  // 48 bits d'horodatage, gros-boutiste.
  let ts = timestampMs;
  for (let i = 5; i >= 0; i -= 1) {
    view.setUint8(i, ts % 256);
    ts = Math.floor(ts / 256);
  }

  bytes.set(randomBytes(10).subarray(0, 10), 6);

  // Version 7 sur les 4 bits de poids fort de l'octet 6.
  view.setUint8(6, (view.getUint8(6) & 0x0f) | 0x70);
  // Variante RFC 4122 (10xx) sur les 2 bits de poids fort de l'octet 8.
  view.setUint8(8, (view.getUint8(8) & 0x3f) | 0x80);

  const hex = Array.from(bytes, toHex);
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export const isUuidV7 = (value: string): boolean => UUID_PATTERN.test(value);

/** Extrait l'horodatage de création encodé dans un UUIDv7. */
export const timestampOfUuidV7 = (uuid: string): number => {
  if (!isUuidV7(uuid)) throw new RangeError(`UUIDv7 invalide : ${uuid}`);
  return parseInt(uuid.slice(0, 8) + uuid.slice(9, 13), 16);
};
