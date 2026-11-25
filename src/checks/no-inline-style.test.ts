import { runLiquidCheck } from '@shopify/theme-check-common/dist/test';
import { describe, expect, it } from 'bun:test';
import { NoInlineStyle } from './no-inline-style.js';

const file = 'sections/my-section.liquid';
const run = (source: string) => runLiquidCheck(NoInlineStyle, source, file);

describe('NoInlineStyle', () => {
  describe('passes', () => {
    it('without a style attribute', async () => {
      expect(await run('<div class="a"></div>')).toHaveLength(0);
    });

    it('with a custom property only', async () => {
      expect(await run('<div style="--columns: 3"></div>')).toHaveLength(0);
    });

    it('with a custom property set from Liquid', async () => {
      expect(await run('<div style="--columns: {{ block.settings.columns }}"></div>')).toHaveLength(0);
    });

    it('with multiple custom properties', async () => {
      expect(await run('<div style="--a: 1; --b: {{ x }}px;"></div>')).toHaveLength(0);
    });

    it('with single quotes and unquoted values', async () => {
      expect(await run("<div style='--a: 1'></div>")).toHaveLength(0);
      expect(await run('<div style=--a:1></div>')).toHaveLength(0);
    });

    it('with a value consisting only of Liquid output', async () => {
      expect(await run('<div style="{{ style }}"></div>')).toHaveLength(0);
    });

    it('with an if-wrapped custom property', async () => {
      expect(await run('<div style="{% if x %}--a: 1{% else %}--a: 2{% endif %}"></div>')).toHaveLength(0);
    });

    it('with an empty style attribute', async () => {
      expect(await run('<div style=""></div>')).toHaveLength(0);
    });
  });

  describe('fails', () => {
    it('with a static declaration', async () => {
      const offenses = await run('<div style="color: red"></div>');
      expect(offenses).toHaveLength(1);
      expect(offenses[0]?.message).toMatch(/inline style/i);
    });

    it('with a declaration containing Liquid output', async () => {
      expect(await run('<div style="width: {{ x }}px"></div>')).toHaveLength(1);
    });

    it('with a custom property mixed with a regular one', async () => {
      expect(await run('<div style="--a: 1; color: red"></div>')).toHaveLength(1);
    });

    it('with single quotes and unquoted values', async () => {
      expect(await run("<div style='color: red'></div>")).toHaveLength(1);
      expect(await run('<div style=color:red></div>')).toHaveLength(1);
    });

    it('with an if-wrapped declaration', async () => {
      expect(await run('<div style="{% if x %}display: none{% endif %}"></div>')).toHaveLength(1);
    });

    it('on void elements', async () => {
      expect(await run('<img style="width: 10px">')).toHaveLength(1);
    });

    it('reports once per attribute', async () => {
      expect(await run('<div style="color: red"></div><p style="margin: 0"></p>')).toHaveLength(2);
    });
  });
});
