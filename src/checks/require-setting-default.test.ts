import { check } from '@shopify/theme-check-common/dist/test';
import { describe, expect, it } from 'bun:test';
import { RequireSettingDefault } from './require-setting-default.js';

const sectionFile = 'sections/my-section.liquid';
const blockFile = 'blocks/my-block.liquid';

function makeSource(schema: object): string {
  return ['<div></div>', '{% schema %}', JSON.stringify({ name: 'My section', ...schema }), '{% endschema %}'].join(
    '\n',
  );
}

const run = (files: Record<string, string>, settings: object = {}) =>
  check(files, [RequireSettingDefault], {}, { RequireSettingDefault: { enabled: true, ...settings } });

describe('RequireSettingDefault', () => {
  it('does not report when defaults are present', async () => {
    const settings = [
      { type: 'range', id: 'r', label: 'R', min: 0, max: 10, step: 1, default: 5 },
      { type: 'checkbox', id: 'c', label: 'C', default: false },
      { type: 'select', id: 's', label: 'S', options: [{ value: 'a', label: 'A' }], default: 'a' },
    ];
    expect(await run({ [sectionFile]: makeSource({ settings }) })).toHaveLength(0);
  });

  it('reports each default type when missing', async () => {
    const settings = [
      { type: 'range', id: 'r', label: 'R', min: 0, max: 10, step: 1 },
      { type: 'checkbox', id: 'c', label: 'C' },
      { type: 'select', id: 's', label: 'S', options: [{ value: 'a', label: 'A' }] },
      { type: 'radio', id: 'ra', label: 'RA', options: [{ value: 'a', label: 'A' }] },
      { type: 'text_alignment', id: 't', label: 'T' },
    ];
    const offenses = await run({ [sectionFile]: makeSource({ settings }) });
    expect(offenses).toHaveLength(5);
  });

  it('reports on the setting id node', async () => {
    const source = makeSource({ settings: [{ type: 'checkbox', id: 'my_check', label: 'C' }] });
    const offenses = await run({ [sectionFile]: source });
    expect(offenses).toHaveLength(1);
    expect(offenses[0]!.message).toMatch(/my_check/);
    const { start, end } = offenses[0]!;
    expect(source.slice(start.index, end.index)).toBe('"my_check"');
  });

  it('ignores types that are not configured', async () => {
    const settings = [{ type: 'text', id: 't', label: 'T' }];
    expect(await run({ [sectionFile]: makeSource({ settings }) })).toHaveLength(0);
  });

  it('ignores display-only types even when configured', async () => {
    const settings = [
      { type: 'header', content: 'Heading' },
      { type: 'paragraph', content: 'Text' },
    ];
    const offenses = await run({ [sectionFile]: makeSource({ settings }) }, { types: ['header', 'paragraph'] });
    expect(offenses).toHaveLength(0);
  });

  it('respects a custom type list', async () => {
    const settings = [
      { type: 'text', id: 't', label: 'T' },
      { type: 'checkbox', id: 'c', label: 'C' },
    ];
    const offenses = await run({ [sectionFile]: makeSource({ settings }) }, { types: ['text'] });
    expect(offenses).toHaveLength(1);
    expect(offenses[0]!.message).toMatch(/'t'/);
  });

  it('reports settings of nested section blocks', async () => {
    const blocks = [{ type: 'item', name: 'Item', settings: [{ type: 'checkbox', id: 'nested', label: 'N' }] }];
    const offenses = await run({ [sectionFile]: makeSource({ blocks }) });
    expect(offenses).toHaveLength(1);
    expect(offenses[0]!.message).toMatch(/nested/);
  });

  it('reports settings in theme block files', async () => {
    const offenses = await run({
      [blockFile]: makeSource({ settings: [{ type: 'text_alignment', id: 'align', label: 'A' }] }),
    });
    expect(offenses).toHaveLength(1);
  });

  it('does not report on non-section/block files', async () => {
    const source = makeSource({ settings: [{ type: 'checkbox', id: 'c', label: 'C' }] });
    expect(await run({ 'snippets/my-snippet.liquid': source })).toHaveLength(0);
  });
});
