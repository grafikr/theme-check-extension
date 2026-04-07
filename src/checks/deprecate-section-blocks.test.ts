import { runLiquidCheck } from '@shopify/theme-check-common/dist/test';
import { describe, expect, it } from 'vitest';
import { DeprecateSectionBlocks } from './deprecate-section-blocks.js';

const sectionFile = 'sections/my-section.liquid';

describe('DeprecateSectionBlocks', () => {
  it('reports a section block', async () => {
    const source = `
      {% schema %}
      {
        "name": "My Section",
        "blocks": [
          {
            "type": "text",
            "name": "Text",
            "settings": [
              { "type": "text", "id": "content", "label": "Content" }
            ]
          }
        ]
      }
      {% endschema %}
    `;

    const offenses = await runLiquidCheck(
      DeprecateSectionBlocks,
      source,
      sectionFile,
    );

    expect(offenses).toHaveLength(1);
  });

  it('reports each section block independently', async () => {
    const source = `
      {% schema %}
      {
        "name": "My Section",
        "blocks": [
          {
            "type": "text",
            "name": "Text",
            "settings": []
          },
          {
            "type": "image",
            "name": "Image",
            "settings": []
          }
        ]
      }
      {% endschema %}
    `;

    const offenses = await runLiquidCheck(
      DeprecateSectionBlocks,
      source,
      sectionFile,
    );

    expect(offenses).toHaveLength(2);
  });

  it('does not report theme blocks', async () => {
    const source = `
      {% schema %}
      {
        "name": "My Section",
        "blocks": [
          { "type": "@app" }
        ]
      }
      {% endschema %}
    `;

    const offenses = await runLiquidCheck(
      DeprecateSectionBlocks,
      source,
      sectionFile,
    );

    expect(offenses).toHaveLength(0);
  });

  it('does not report when there are no blocks', async () => {
    const source = `
      {% schema %}
      {
        "name": "My Section",
        "settings": []
      }
      {% endschema %}
    `;

    const offenses = await runLiquidCheck(
      DeprecateSectionBlocks,
      source,
      sectionFile,
    );

    expect(offenses).toHaveLength(0);
  });

  it('does not report when the schema tag is missing', async () => {
    const source = `<div>No schema here</div>`;

    const offenses = await runLiquidCheck(
      DeprecateSectionBlocks,
      source,
      sectionFile,
    );

    expect(offenses).toHaveLength(0);
  });

  it('only report section blocks', async () => {
    const source = `
      {% schema %}
      {
        "name": "My Section",
        "blocks": [
          { "type": "@app" },
          {
            "type": "text",
            "name": "Text",
            "settings": []
          }
        ]
      }
      {% endschema %}
    `;

    const offenses = await runLiquidCheck(
      DeprecateSectionBlocks,
      source,
      sectionFile,
    );

    expect(offenses).toHaveLength(1);
  });
});
