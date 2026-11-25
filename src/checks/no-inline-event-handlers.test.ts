import { runLiquidCheck } from '@shopify/theme-check-common/dist/test';
import { describe, expect, it } from 'bun:test';
import { NoInlineEventHandlers } from './no-inline-event-handlers.js';

const file = 'sections/my-section.liquid';
const run = (source: string) => runLiquidCheck(NoInlineEventHandlers, source, file);

describe('NoInlineEventHandlers', () => {
  it('reports onclick on an element', async () => {
    const offenses = await run('<button onclick="go()">Go</button>');
    expect(offenses).toHaveLength(1);
    expect(offenses.at(0)?.message).toContain('onclick');
  });

  it('reports mixed-case names', async () => {
    expect(await run('<select onChange="x()"></select>')).toHaveLength(1);
  });

  it('reports on void elements', async () => {
    expect(await run('<input type="text" onchange="x()">')).toHaveLength(1);
  });

  it('reports on raw nodes', async () => {
    expect(await run('<script onload="x()"></script>')).toHaveLength(1);
  });

  it('reports valueless and unquoted handlers', async () => {
    expect(await run('<form onsubmit></form>')).toHaveLength(1);
    expect(await run('<body onload=init()></body>')).toHaveLength(1);
  });

  it('reports each handler separately', async () => {
    expect(await run('<div onclick="a()" onmouseover="b()"></div>')).toHaveLength(2);
  });

  it('reports on the attribute name node', async () => {
    const source = '<button class="a" onclick="go()">Go</button>';
    const offenses = await run(source);
    const start = source.indexOf('onclick');
    expect(offenses.at(0)?.start.index).toBe(start);
    expect(offenses.at(0)?.end.index).toBe(start + 'onclick'.length);
  });

  it('does not report non-handlers', async () => {
    expect(await run('<div one-thing="x" data-onclick="y" on="z" on-click="w"></div>')).toHaveLength(0);
  });

  it('does not report elements without handlers', async () => {
    expect(await run('<button class="a" type="button">Go</button>')).toHaveLength(0);
  });

  it('does not report names containing Liquid', async () => {
    expect(await run('<div on{{ event }}="x()"></div>')).toHaveLength(0);
    expect(await run('<div {{ attr }}="x()"></div>')).toHaveLength(0);
  });

  it('does not report handler-looking text in content or script bodies', async () => {
    expect(await run('<p>onclick="x"</p>')).toHaveLength(0);
    expect(await run('<script>el.onclick = () => {};</script>')).toHaveLength(0);
  });
});
