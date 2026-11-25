import type { LiquidCheckDefinition } from '@shopify/theme-check-common';
import { Severity, SourceCodeType } from '@shopify/theme-check-common';

// Stands in for any Liquid node (output or tag) when flattening an attribute value.
const LIQUID = '\u0000';

type ValueLike = { type: string; value?: string; children?: ValueLike[] };

/**
 * Flattens an attribute value into a string where text is kept as-is and each
 * Liquid node is replaced by a placeholder. Children of Liquid tags (e.g. the
 * branches of an `{% if %}`) are inlined so their text is inspected too.
 */
function flatten(nodes: ValueLike[]): string {
  let out = '';
  for (const node of nodes) {
    if (node.type === 'TextNode') {
      out += node.value ?? '';
    } else {
      out += LIQUID;
      if (Array.isArray(node.children)) out += flatten(node.children);
      out += LIQUID;
    }
  }
  return out;
}

function hasStaticDeclaration(value: string): boolean {
  return value.split(/[;\u0000]/).some((declaration) => {
    const colon = declaration.indexOf(':');
    if (colon === -1) return false;
    const property = declaration.slice(0, colon).trim();
    // Custom properties are allowed; empty names (e.g. produced by Liquid) are unknowable.
    return property !== '' && !property.startsWith('--');
  });
}

type AttrLike = {
  name: ValueLike[];
  value: ValueLike[];
  position: { start: number; end: number };
};

export const NoInlineStyle: LiquidCheckDefinition = {
  meta: {
    code: 'NoInlineStyle',
    name: 'No Inline Style',
    docs: {
      description:
        'Disallow inline style attributes with static CSS declarations. Style attributes that only set CSS custom properties are allowed.',
      recommended: true,
    },
    type: SourceCodeType.LiquidHtml,
    severity: Severity.WARNING,
    schema: {},
  },

  create(context) {
    function visit(node: AttrLike) {
      const [name] = node.name;
      const isStyle = node.name.length === 1 && name?.type === 'TextNode' && name.value?.toLowerCase() === 'style';
      if (!isStyle || !hasStaticDeclaration(flatten(node.value))) return;

      context.report({
        message:
          'Avoid inline styles with static CSS declarations. Use a CSS class, or a CSS custom property (e.g. style="--name: value").',
        startIndex: node.position.start,
        endIndex: node.position.end,
      });
    }

    return {
      async AttrDoubleQuoted(node) {
        visit(node as unknown as AttrLike);
      },
      async AttrSingleQuoted(node) {
        visit(node as unknown as AttrLike);
      },
      async AttrUnquoted(node) {
        visit(node as unknown as AttrLike);
      },
    };
  },
};
