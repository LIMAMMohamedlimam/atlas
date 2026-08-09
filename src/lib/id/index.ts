import { getRandomValues } from 'expo-crypto';

import { uuidV7, type RandomBytes } from './uuid-v7';

const secureRandomBytes: RandomBytes = (length) => getRandomValues(new Uint8Array(length));

/** Identifiant d'une ligne de base : UUIDv7 généré sur l'appareil. */
export const newId = (): string => uuidV7(secureRandomBytes);

export { isUuidV7, timestampOfUuidV7, uuidV7, type RandomBytes } from './uuid-v7';
