import { parseDecimal } from './number';

describe('parseDecimal', () => {
  it('renvoie null pour une saisie vide ou blanche', () => {
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('   ')).toBeNull();
  });

  it('parse un entier', () => {
    expect(parseDecimal('150')).toBe(150);
  });

  it('accepte la virgule française', () => {
    expect(parseDecimal('150,5')).toBe(150.5);
  });

  it('accepte le point décimal', () => {
    expect(parseDecimal('12.3')).toBe(12.3);
  });

  it('ignore les espaces autour', () => {
    expect(parseDecimal('  42  ')).toBe(42);
  });

  it('refuse une valeur négative', () => {
    expect(parseDecimal('-5')).toBeNull();
  });

  it('refuse du texte', () => {
    expect(parseDecimal('abc')).toBeNull();
  });
});
