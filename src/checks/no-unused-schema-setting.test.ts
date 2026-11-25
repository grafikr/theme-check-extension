import { runLiquidCheck } from '@shopify/theme-check-common/dist/test';
import { describe, expect, it } from 'bun:test';
import { NoUnusedSchemaSetting } from './no-unused-schema-setting.js';

const sectionFile = 'sections/my-section.liquid';
const blockFile = 'blocks/my-block.liquid';

const schema = (settings: string) => `
  {% schema %}
  { "name": "X", "settings": [${settings}] }
  {% endschema %}
`;
const text = (id: string) => `{ "type": "text", "id": "${id}", "label": "L" }`;

const run = (source: string, file = sectionFile) => runLiquidCheck(NoUnusedSchemaSetting, source, file);

describe('NoUnusedSchemaSetting', () => {
  it('reports an unused setting on its id value', async () => {
    const source = `<p>{{ section.settings.used }}</p>${schema(`${text('used')}, ${text('unused')}`)}`;
    const offenses = await run(source);
    expect(offenses).toHaveLength(1);
    expect(source.slice(offenses[0]?.start.index, offenses[0]?.end.index)).toBe('"unused"');
  });

  it('reports in block files using block.settings', async () => {
    const source = `{{ block.settings.a }}${schema(`${text('a')}, ${text('b')}`)}`;
    expect(await run(source, blockFile)).toHaveLength(1);
  });

  it('does not report used settings (dot, bracket, block, settings)', async () => {
    const source = `{{ section.settings.a }}{{ section.settings['b'] }}{{ block.settings["c"] }}{{ settings.d }}${schema(
      ['a', 'b', 'c', 'd'].map(text).join(','),
    )}`;
    expect(await run(source)).toHaveLength(0);
  });

  it('counts usage inside liquid tags and with filters', async () => {
    const source = `{% liquid
  assign x = section.settings.a | upcase
  render 'snip', v: section.settings.b
%}${schema(`${text('a')}, ${text('b')}`)}`;
    expect(await run(source)).toHaveLength(0);
  });

  it('counts usage inside conditions and style tags', async () => {
    const source = `{% if section.settings.a %}x{% endif %}{% style %}.a{color:{{ section.settings.b }}}{% endstyle %}${schema(
      `${text('a')}, ${text('b')}`,
    )}`;
    expect(await run(source)).toHaveLength(0);
  });

  it('ignores header and paragraph settings', async () => {
    const source = schema(`{ "type": "header", "content": "H" }, { "type": "paragraph", "content": "P" }`);
    expect(await run(source)).toHaveLength(0);
  });

  it('skips when the whole settings object is passed to render', async () => {
    const source = `{% render 'x', settings: section.settings %}${schema(text('a'))}`;
    expect(await run(source)).toHaveLength(0);
  });

  it('skips when iterating over settings', async () => {
    const source = `{% for s in block.settings %}{{ s }}{% endfor %}${schema(text('a'))}`;
    expect(await run(source, blockFile)).toHaveLength(0);
  });

  it('skips on dynamic bracket access', async () => {
    const source = `{% assign k = 'a' %}{{ section.settings[k] }}${schema(text('a'))}`;
    expect(await run(source)).toHaveLength(0);
  });

  it('does not report other files', async () => {
    expect(await run(schema(text('a')), 'snippets/foo.liquid')).toHaveLength(0);
  });

  it('does not report without a schema', async () => {
    expect(await run('<div></div>')).toHaveLength(0);
  });

  it('ignores block-level settings', async () => {
    const source = `{% schema %}{ "name": "X", "blocks": [{ "type": "t", "name": "T", "settings": [${text('inner')}] }] }{% endschema %}`;
    expect(await run(source)).toHaveLength(0);
  });
});
