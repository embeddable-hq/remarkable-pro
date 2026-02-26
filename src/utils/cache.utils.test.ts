import { cache } from './cache.utils';

describe('cache', () => {
  it('calls the factory only once for the same params', () => {
    const factory = vi.fn((params?: { n: number }) => ({ value: params?.n }));
    const get = cache(factory);

    get({ n: 1 });
    get({ n: 1 });

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('returns the same object reference on repeated calls', () => {
    const get = cache(() => ({ created: Date.now() }));
    const first = get();
    const second = get();
    expect(first).toBe(second);
  });

  it('calls the factory again for different params', () => {
    const factory = vi.fn((params?: { n: number }) => ({ value: params?.n }));
    const get = cache(factory);

    get({ n: 1 });
    get({ n: 2 });

    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('returns different instances for different params', () => {
    const get = cache((params?: { n: number }) => ({ value: params?.n }));
    expect(get({ n: 1 })).not.toBe(get({ n: 2 }));
  });

  it('handles undefined params', () => {
    const factory = vi.fn(() => 'result');
    const get = cache(factory);

    get();
    get();

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('caches independently per factory instance', () => {
    const factoryA = vi.fn(() => 'a');
    const factoryB = vi.fn(() => 'b');
    const getA = cache(factoryA);
    const getB = cache(factoryB);

    getA();
    getB();
    getA();
    getB();

    expect(factoryA).toHaveBeenCalledTimes(1);
    expect(factoryB).toHaveBeenCalledTimes(1);
  });
});
