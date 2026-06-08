import { check, runLiquidCheck } from '@shopify/theme-check-common/dist/test';
import { describe, expect, it } from 'vitest';
import { MaxLines } from './max-lines.js';

const sectionFile = 'sections/my-section.liquid';

describe('MaxLines', () => {
  it('does not report when file is within the default limit', async () => {
    const source = Array(300).fill('<div></div>').join('\n');
    const offenses = await runLiquidCheck(MaxLines, source, sectionFile);
    expect(offenses).toHaveLength(0);
  });

  it('reports when file exceeds the default limit', async () => {
    const source = Array(301).fill('<div></div>').join('\n');
    const offenses = await runLiquidCheck(MaxLines, source, sectionFile);
    expect(offenses).toHaveLength(1);
    expect(offenses.at(0)?.message).toMatch(/301.*300/);
  });

  it('reports with a custom max', async () => {
    const source = Array(6).fill('<div></div>').join('\n');
    const offenses = await check(
      { [sectionFile]: source },
      [MaxLines],
      {},
      { MaxLines: { enabled: true, max: 5 } },
    );
    expect(offenses).toHaveLength(1);
    expect(offenses.at(0)?.message).toMatch(/6.*5/);
  });

  it('does not report when file equals the max', async () => {
    const source = Array(5).fill('<div></div>').join('\n');
    const offenses = await check(
      { [sectionFile]: source },
      [MaxLines],
      {},
      { MaxLines: { enabled: true, max: 5 } },
    );
    expect(offenses).toHaveLength(0);
  });

  it('reports the offset at the first excess line', async () => {
    const line1 = '<div>line1</div>';
    const line2 = '<div>line2</div>';
    const line3 = '<div>line3</div>';
    const source = [line1, line2, line3].join('\n');
    const offenses = await check(
      { [sectionFile]: source },
      [MaxLines],
      {},
      { MaxLines: { enabled: true, max: 2 } },
    );
    expect(offenses).toHaveLength(1);
    expect(offenses.at(0)?.start.index).toBe(
      line1.length + 1 + line2.length + 1,
    );
  });

  describe('skipBlankLines', () => {
    it('counts blank lines by default', async () => {
      // 3 content lines + 2 blank lines = 5 total
      const source = Array(3).fill('<div></div>').join('\n\n');
      const offenses = await check(
        { [sectionFile]: source },
        [MaxLines],
        {},
        { MaxLines: { enabled: true, max: 4 } },
      );
      expect(offenses).toHaveLength(1);
    });

    it('skips blank lines when enabled', async () => {
      // 3 content lines + 2 blank lines = 5 total, but only 3 non-blank
      const source = Array(3).fill('<div></div>').join('\n\n');
      const offenses = await check(
        { [sectionFile]: source },
        [MaxLines],
        {},
        { MaxLines: { enabled: true, max: 4, skipBlankLines: true } },
      );
      expect(offenses).toHaveLength(0);
    });
  });

  describe('skipComments', () => {
    it('counts liquid comment lines by default', async () => {
      const source = [
        '<div></div>',
        '{% comment %}',
        'This is a comment',
        '{% endcomment %}',
        '<div></div>',
      ].join('\n');
      const offenses = await check(
        { [sectionFile]: source },
        [MaxLines],
        {},
        { MaxLines: { enabled: true, max: 4 } },
      );
      expect(offenses).toHaveLength(1);
    });

    it('skips liquid comment blocks when enabled', async () => {
      // 5 lines total, but only 2 non-comment lines
      const source = [
        '<div></div>',
        '{% comment %}',
        'This is a comment',
        '{% endcomment %}',
        '<div></div>',
      ].join('\n');
      const offenses = await check(
        { [sectionFile]: source },
        [MaxLines],
        {},
        { MaxLines: { enabled: true, max: 4, skipComments: true } },
      );
      expect(offenses).toHaveLength(0);
    });

    it('skips liquid comment blocks with dash syntax', async () => {
      const source = [
        '<div></div>',
        '{%- comment -%}',
        'This is a comment',
        '{%- endcomment -%}',
        '<div></div>',
      ].join('\n');
      const offenses = await check(
        { [sectionFile]: source },
        [MaxLines],
        {},
        { MaxLines: { enabled: true, max: 2, skipComments: true } },
      );
      expect(offenses).toHaveLength(0);
    });

    it('skips HTML comment lines when enabled', async () => {
      // 3 lines, 1 HTML comment — only 2 non-comment lines
      const source = [
        '<div></div>',
        '<!-- this is a comment -->',
        '<div></div>',
      ].join('\n');
      const offenses = await check(
        { [sectionFile]: source },
        [MaxLines],
        {},
        { MaxLines: { enabled: true, max: 2, skipComments: true } },
      );
      expect(offenses).toHaveLength(0);
    });

    it('skips inline liquid comment blocks', async () => {
      // An inline {% comment %}...{% endcomment %} on one line is still a comment-only line
      const source = [
        '<div></div>',
        '{% comment %}inline{% endcomment %}',
        '<div></div>',
      ].join('\n');
      const offenses = await check(
        { [sectionFile]: source },
        [MaxLines],
        {},
        { MaxLines: { enabled: true, max: 2, skipComments: true } },
      );
      expect(offenses).toHaveLength(0);
    });

    it('skips {% # inline %} comments', async () => {
      const source = [
        '<div></div>',
        '{% # this is an inline comment %}',
        '<div></div>',
      ].join('\n');
      const offenses = await check(
        { [sectionFile]: source },
        [MaxLines],
        {},
        { MaxLines: { enabled: true, max: 2, skipComments: true } },
      );
      expect(offenses).toHaveLength(0);
    });

    it('skips {%- # inline -%} comments with dash syntax', async () => {
      const source = [
        '<div></div>',
        '{%- # this is an inline comment -%}',
        '<div></div>',
      ].join('\n');
      const offenses = await check(
        { [sectionFile]: source },
        [MaxLines],
        {},
        { MaxLines: { enabled: true, max: 2, skipComments: true } },
      );
      expect(offenses).toHaveLength(0);
    });

    it('counts {% # inline %} comments when skipComments is false', async () => {
      const source = [
        '<div></div>',
        '{% # this is an inline comment %}',
        '<div></div>',
      ].join('\n');
      const offenses = await check(
        { [sectionFile]: source },
        [MaxLines],
        {},
        { MaxLines: { enabled: true, max: 2 } },
      );
      expect(offenses).toHaveLength(1);
    });

    it('skips multi-line {%\\n  # ...\\n%} comment blocks', async () => {
      // 6 lines total, only 2 are non-comment
      const source = [
        '<div></div>',
        '{%',
        '  # line one',
        '  # line two',
        '%}',
        '<div></div>',
      ].join('\n');
      const offenses = await check(
        { [sectionFile]: source },
        [MaxLines],
        {},
        { MaxLines: { enabled: true, max: 2, skipComments: true } },
      );
      expect(offenses).toHaveLength(0);
    });

    it('does not skip a multi-line {%\\n  ...\\n%} block that contains code', async () => {
      // {%\n assign \n%} is not a comment block — all 4 lines count
      const source = ['<div></div>', '{%', '  assign x = 1', '%}'].join('\n');
      const offenses = await check(
        { [sectionFile]: source },
        [MaxLines],
        {},
        { MaxLines: { enabled: true, max: 3, skipComments: true } },
      );
      expect(offenses).toHaveLength(1);
    });
  });
});
