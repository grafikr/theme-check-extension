import { check } from '@shopify/theme-check-common/dist/test';
import { describe, expect, it } from 'bun:test';
import { FileNamingConvention } from './file-naming-convention.js';

const run = (path: string, settings: Record<string, unknown> = {}) =>
  check({ [path]: '<div></div>' }, [FileNamingConvention], {}, { FileNamingConvention: { enabled: true, ...settings } });

describe('FileNamingConvention', () => {
  it.each([
    'snippets/product-card.liquid',
    'snippets/_internal-helper.liquid',
    'snippets/icon2.liquid',
    'blocks/hero-banner.liquid',
    'blocks/_private-block.liquid',
    'sections/main-product.liquid',
  ])('passes %s', async (path) => {
    expect(await run(path)).toHaveLength(0);
  });

  it.each([
    'snippets/ProductCard.liquid',
    'snippets/product_card.liquid',
    'snippets/__double.liquid',
    'snippets/trailing-.liquid',
    'blocks/Hero.liquid',
    'blocks/hero--banner.liquid',
    'sections/MainProduct.liquid',
    'sections/_private.liquid',
  ])('reports %s', async (path) => {
    const offenses = await run(path);
    expect(offenses).toHaveLength(1);
    expect(offenses[0]?.message).toMatch(/expected pattern/);
    expect(offenses[0]?.start.index).toBe(0);
  });

  it('only checks the basename, never parent directories', async () => {
    expect(await run('sections/my-section.liquid')).toHaveLength(0);
    // isSection() does not match nested paths (Shopify sections are flat), so they are skipped
    expect(await run('sections/Nested/BadName.liquid')).toHaveLength(0);
  });

  it('ignores other directories', async () => {
    expect(await run('layout/Theme_Layout.liquid')).toHaveLength(0);
    expect(await run('templates/Weird_Name.liquid')).toHaveLength(0);
  });

  it('supports a custom pattern per directory', async () => {
    const settings = { snippets: '^ui-[a-z-]+$' };
    expect(await run('snippets/ui-button.liquid', settings)).toHaveLength(0);
    const offenses = await run('snippets/button.liquid', settings);
    expect(offenses).toHaveLength(1);
    expect(offenses[0]?.message).toContain('^ui-[a-z-]+$');
    // other directories keep their defaults
    expect(await run('blocks/hero-banner.liquid', settings)).toHaveLength(0);
  });

  it('reports an invalid regex instead of throwing', async () => {
    const offenses = await run('snippets/product-card.liquid', { snippets: '([' });
    expect(offenses).toHaveLength(1);
    expect(offenses[0]?.message).toMatch(/Invalid regular expression/);
  });
});
