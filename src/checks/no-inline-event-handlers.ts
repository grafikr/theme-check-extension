import type { LiquidCheckDefinition } from '@shopify/theme-check-common';
import { Severity, SourceCodeType } from '@shopify/theme-check-common';

const EVENT_HANDLER_NAME = /^on[a-z]+$/i;

export const NoInlineEventHandlers: LiquidCheckDefinition = {
  meta: {
    code: 'NoInlineEventHandlers',
    name: 'No Inline Event Handlers',
    docs: {
      description:
        'Disallow inline event handler attributes (e.g. onclick). They conflict with CSP and with keeping behavior in components.',
      recommended: true,
    },
    type: SourceCodeType.LiquidHtml,
    severity: Severity.WARNING,
    schema: {},
  },

  create(context) {
    type AttrLike = { name?: unknown };

    function checkAttributes(attributes: AttrLike[]) {
      for (const attr of attributes) {
        // Liquid nodes used as attributes (e.g. {% if %}) have no name array
        if (!Array.isArray(attr.name)) continue;
        // Only flag purely static names (a single text node)
        if (attr.name.length !== 1) continue;
        const nameNode = attr.name[0];
        if (nameNode?.type !== 'TextNode') continue;
        if (!EVENT_HANDLER_NAME.test(nameNode.value)) continue;

        context.report({
          message: `Avoid inline event handler '${nameNode.value}'. Attach the listener in a component instead.`,
          startIndex: nameNode.position.start,
          endIndex: nameNode.position.end,
        });
      }
    }

    return {
      async HtmlElement(node) {
        checkAttributes(node.attributes);
      },
      async HtmlVoidElement(node) {
        checkAttributes(node.attributes);
      },
      async HtmlRawNode(node) {
        checkAttributes(node.attributes);
      },
    };
  },
};
