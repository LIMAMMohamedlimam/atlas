import {
  addDays,
  compareDays,
  daysBetween,
  isFutureDay,
  isLocalDay,
  isSameDay,
  localDay,
  nowTimestamp,
  todayLocalDay,
  startOfWeek,
  toLocalDay,
} from './index';

describe('validation', () => {
  it('accepte un jour local valide', () => {
    expect(isLocalDay('2026-08-09')).toBe(true);
  });

  it('rejette les formats et les dates impossibles', () => {
    expect(isLocalDay('2026-8-9')).toBe(false);
    expect(isLocalDay('2026-02-31')).toBe(false);
    expect(isLocalDay('2026-13-01')).toBe(false);
    expect(() => localDay('pas une date')).toThrow(RangeError);
  });
});

describe('toLocalDay', () => {
  // SPEC-001 CA-6 : un repas saisi à 23 h 50 reste rattaché au jour local en cours,
  // même si l'instant correspondant est déjà le lendemain en UTC.
  it('rattache un instant tardif au bon jour local', () => {
    const lateEvening = new Date(2026, 7, 9, 23, 50, 0);
    expect(toLocalDay(lateEvening)).toBe('2026-08-09');
  });

  it('rattache un instant juste après minuit au jour suivant', () => {
    const justAfterMidnight = new Date(2026, 7, 10, 0, 5, 0);
    expect(toLocalDay(justAfterMidnight)).toBe('2026-08-10');
  });
});

describe('addDays', () => {
  it('avance et recule dans le mois', () => {
    expect(addDays(localDay('2026-08-09'), 1)).toBe('2026-08-10');
    expect(addDays(localDay('2026-08-09'), -1)).toBe('2026-08-08');
  });

  it('franchit les fins de mois et les années bissextiles', () => {
    expect(addDays(localDay('2026-08-31'), 1)).toBe('2026-09-01');
    expect(addDays(localDay('2026-12-31'), 1)).toBe('2027-01-01');
    expect(addDays(localDay('2028-02-28'), 1)).toBe('2028-02-29');
  });

  // Le passage à l'heure d'été (France : dernier dimanche de mars) supprime une heure.
  // Un calcul naïf en millisecondes ferait sauter ou répéter un jour.
  it("n'est pas perturbé par le changement d'heure", () => {
    expect(addDays(localDay('2026-03-28'), 1)).toBe('2026-03-29');
    expect(addDays(localDay('2026-03-29'), 1)).toBe('2026-03-30');
    expect(addDays(localDay('2026-10-24'), 1)).toBe('2026-10-25');
    expect(addDays(localDay('2026-10-25'), 1)).toBe('2026-10-26');
  });
});

describe('nowTimestamp', () => {
  it("renvoie l'instant absolu en millisecondes UTC", () => {
    const instant = new Date(Date.UTC(2026, 7, 9, 21, 50, 0));
    expect(nowTimestamp(instant)).toBe(instant.getTime());
  });

  it("utilise l'horloge courante par défaut", () => {
    const before = Date.now();
    const value = nowTimestamp();
    expect(value).toBeGreaterThanOrEqual(before);
    expect(value).toBeLessThanOrEqual(Date.now());
  });
});

describe('todayLocalDay', () => {
  it("s'appuie sur l'horloge de l'appareil par défaut", () => {
    expect(todayLocalDay()).toBe(toLocalDay(new Date()));
  });

  it('accepte un instant explicite', () => {
    expect(todayLocalDay(new Date(2026, 7, 9, 12, 0, 0))).toBe('2026-08-09');
  });
});

describe('comparaisons', () => {
  it('reconnaît deux fois le même jour', () => {
    expect(isSameDay(localDay('2026-08-09'), localDay('2026-08-09'))).toBe(true);
    expect(isSameDay(localDay('2026-08-09'), localDay('2026-08-10'))).toBe(false);
  });

  it('se trie correctement en ordre lexicographique', () => {
    const days = ['2026-08-10', '2026-01-02', '2025-12-31'].map(localDay);
    expect([...days].sort(compareDays)).toEqual(['2025-12-31', '2026-01-02', '2026-08-10']);
  });

  // SPEC-001 RG-9 : pas de saisie au-delà d'aujourd'hui.
  it('détecte un jour futur', () => {
    const today = localDay('2026-08-09');
    expect(isFutureDay(localDay('2026-08-10'), today)).toBe(true);
    expect(isFutureDay(localDay('2026-08-09'), today)).toBe(false);
    expect(isFutureDay(localDay('2026-08-08'), today)).toBe(false);
  });

  it("compare à aujourd'hui quand aucune date de référence n'est fournie", () => {
    expect(isFutureDay(addDays(todayLocalDay(), 1))).toBe(true);
    expect(isFutureDay(todayLocalDay())).toBe(false);
  });
});

describe('daysBetween', () => {
  it('compte les jours calendaires', () => {
    expect(daysBetween(localDay('2026-08-09'), localDay('2026-08-16'))).toBe(7);
    expect(daysBetween(localDay('2026-08-16'), localDay('2026-08-09'))).toBe(-7);
    expect(daysBetween(localDay('2026-08-09'), localDay('2026-08-09'))).toBe(0);
  });

  it('reste juste à travers un changement d’heure', () => {
    expect(daysBetween(localDay('2026-03-28'), localDay('2026-03-30'))).toBe(2);
    expect(daysBetween(localDay('2026-10-24'), localDay('2026-10-26'))).toBe(2);
  });
});

describe('startOfWeek', () => {
  // 2026-08-09 est un dimanche.
  it('ramène au lundi par défaut', () => {
    expect(startOfWeek(localDay('2026-08-09'))).toBe('2026-08-03');
    expect(startOfWeek(localDay('2026-08-03'))).toBe('2026-08-03');
  });

  it('accepte le dimanche comme premier jour', () => {
    expect(startOfWeek(localDay('2026-08-09'), 0)).toBe('2026-08-09');
  });
});
