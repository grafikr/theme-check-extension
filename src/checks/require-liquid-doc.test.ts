import { runLiquidCheck } from '@shopify/theme-check-common/dist/test';
import { describe, expect, it } from 'bun:test';
import { RequireLiquidDoc } from './require-liquid-doc.js';

const doc = '{% doc %}\n  @param {string} title - The title\n{% enddoc %}';

describe('RequireLiquidDoc', () => {
  it('does not report a snippet with a doc block', async () => {
    const offenses = await runLiquidCheck(RequireLiquidDoc, `${doc}\n<div></div>`, 'snippets/card.liquid');
    expect(offenses).toHaveLength(0);
  });

  it('does not report a block with a doc block', async () => {
    const offenses = await runLiquidCheck(RequireLiquidDoc, `${doc}\n<div></div>`, 'blocks/card.liquid');
    expect(offenses).toHaveLength(0);
  });

  it('accepts a doc block anywhere in the file, with dash syntax', async () => {
    const source = '<div></div>\n{%- doc -%}\nDocs\n{%- enddoc -%}\n<span></span>';
    const offenses = await runLiquidCheck(RequireLiquidDoc, source, 'snippets/card.liquid');
    expect(offenses).toHaveLength(0);
  });

  it('reports a snippet without a doc block at the start of the file', async () => {
    const offenses = await runLiquidCheck(RequireLiquidDoc, '<div></div>\n<span></span>', 'snippets/card.liquid');
    expect(offenses).toHaveLength(1);
    expect(offenses.at(0)?.message).toMatch(/Missing \{% doc %\}/);
    expect(offenses.at(0)?.start.index).toBe(0);
    expect(offenses.at(0)?.end.index).toBe('<div></div>'.length);
  });

  it('reports a block without a doc block', async () => {
    const offenses = await runLiquidCheck(RequireLiquidDoc, '<div></div>', 'blocks/card.liquid');
    expect(offenses).toHaveLength(1);
  });

  it('reports an empty file', async () => {
    const offenses = await runLiquidCheck(RequireLiquidDoc, '', 'snippets/empty.liquid');
    expect(offenses).toHaveLength(1);
  });

  it('does not treat a doc inside a comment as documentation', async () => {
    const source = '{% comment %}{% doc %}x{% enddoc %}{% endcomment %}<div></div>';
    const offenses = await runLiquidCheck(RequireLiquidDoc, source, 'snippets/card.liquid');
    expect(offenses).toHaveLength(1);
  });

  it('ignores sections and layouts', async () => {
    expect(await runLiquidCheck(RequireLiquidDoc, '<div></div>', 'sections/hero.liquid')).toHaveLength(0);
    expect(await runLiquidCheck(RequireLiquidDoc, '<div></div>', 'layout/theme.liquid')).toHaveLength(0);
  });
});
