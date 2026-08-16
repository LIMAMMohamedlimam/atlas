/**
 * Tests d'intégration du profil — SPEC-003.
 */
import { createTestContext, type TestContext } from './__fixtures__/test-database';
import { createUserProfileRepository } from './user-profile.repository';

let context: TestContext;
let profile: ReturnType<typeof createUserProfileRepository>;

beforeEach(() => {
  context = createTestContext();
  profile = createUserProfileRepository(context.deps);
});

afterEach(() => context.close());

describe('profil utilisateur', () => {
  it('est absent avant l’onboarding', () => {
    expect(profile.get()).toBeUndefined();
  });

  it('enregistre puis relit le profil (une seule ligne)', () => {
    profile.save({
      birthYear: 1990,
      sex: 'male',
      heightCm: 180,
      activityLevel: 'moderate',
      goalType: 'maintain',
    });

    const saved = profile.get();
    expect(saved).toEqual({
      birthYear: 1990,
      sex: 'male',
      heightCm: 180,
      activityLevel: 'moderate',
      goalType: 'maintain',
    });
  });

  it('écrase la ligne existante au lieu d’en créer une seconde', () => {
    profile.save({
      birthYear: 1990,
      sex: 'male',
      heightCm: 180,
      activityLevel: 'moderate',
      goalType: 'maintain',
    });
    profile.save({
      birthYear: 1995,
      sex: 'female',
      heightCm: 170,
      activityLevel: 'light',
      goalType: 'lose_slow',
    });

    const saved = profile.get();
    expect(saved?.birthYear).toBe(1995);
    expect(saved?.sex).toBe('female');
  });

  it('clear remet les données personnelles à null sans toucher au journal', () => {
    profile.save({
      birthYear: 1990,
      sex: 'male',
      heightCm: 180,
      activityLevel: 'moderate',
      goalType: 'maintain',
    });

    profile.clear();

    expect(profile.get()).toEqual({
      birthYear: null,
      sex: null,
      heightCm: null,
      activityLevel: null,
      goalType: null,
    });
  });
});
