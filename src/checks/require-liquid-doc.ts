import type { LiquidCheckDefinition } from '@shopify/theme-check-common';
import { isBlock, isSnippet, Severity, SourceCodeType } from '@shopify/theme-check-common';

export const RequireLiquidDoc: LiquidCheckDefinition = {
  meta: {
    code: 'RequireLiquidDoc',
    name: 'Require LiquidDoc',
    docs: {
      description: 'Require a {% doc %} block in every snippet and theme block.',
      recommended: true,
    },
    type: SourceCodeType.LiquidHtml,
    severity: Severity.WARNING,
    schema: {},
  },

  create(context) {
    if (!isSnippet(context.file.uri) && !isBlock(context.file.uri)) return {};

    let hasDoc = false;

    return {
      async LiquidRawTag(node) {
        if (node.name === 'doc') hasDoc = true;
      },

      async onCodePathEnd(file) {
        if (hasDoc) return;

        const firstLineLength = file.source.split('\n')[0]?.length ?? 0;
        context.report({
          message: 'Missing {% doc %} block. Document the parameters of this file with LiquidDoc.',
          startIndex: 0,
          endIndex: Math.max(firstLineLength, Math.min(1, file.source.length)),
        });
      },
    };
  },
};
