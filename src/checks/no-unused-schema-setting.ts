import type { LiquidCheckDefinition } from '@shopify/theme-check-common';
import {
  getLocEnd,
  getLocStart,
  getSchema,
  isBlock,
  isSection,
  nodeAtPath,
  Severity,
  SourceCodeType,
} from '@shopify/theme-check-common';

const DISPLAY_ONLY_TYPES = new Set(['header', 'paragraph']);

type DeclaredSetting = { id: string; index: number };

export const NoUnusedSchemaSetting: LiquidCheckDefinition = {
  meta: {
    code: 'NoUnusedSchemaSetting',
    name: 'No Unused Schema Setting',
    docs: {
      description: 'Reports schema settings that are never read in the Liquid of the same file.',
      recommended: true,
    },
    type: SourceCodeType.LiquidHtml,
    severity: Severity.WARNING,
    schema: {},
  },

  create(context) {
    if (!isSection(context.file.uri) && !isBlock(context.file.uri)) {
      return {};
    }

    const usedIds = new Set<string>();
    let passesWholeObject = false;
    let declared: DeclaredSetting[] = [];
    let ast: Parameters<typeof nodeAtPath>[0] | undefined;
    let offset = 0;

    return {
      async LiquidRawTag(node) {
        if (node.name !== 'schema' || node.body.kind !== 'json') {
          return;
        }

        const result = (await getSchema(context)) ?? {};
        const { validSchema } = result;
        if (!result.ast || result.ast instanceof Error || !validSchema || validSchema instanceof Error) {
          return;
        }

        const settings = 'settings' in validSchema ? validSchema.settings : undefined;
        if (!Array.isArray(settings)) {
          return;
        }

        ast = result.ast;
        offset = node.blockStartPosition.end;
        declared = [];
        settings.forEach((setting, index) => {
          if (!setting.id || DISPLAY_ONLY_TYPES.has(setting.type)) {
            return;
          }
          declared.push({ id: setting.id, index });
        });
      },

      async VariableLookup(node) {
        const { name, lookups } = node;
        if (name !== 'section' && name !== 'block' && name !== 'settings') {
          return;
        }

        // `section.settings.<id>` / `block.settings.<id>` read from lookups[1].
        // `settings.<id>` (global form) is also counted as a usage to stay conservative.
        let accessorPos = 0;
        if (name !== 'settings') {
          const first = lookups[0];
          if (!first || first.type !== 'String' || first.value !== 'settings') {
            return;
          }
          accessorPos = 1;
        }

        const accessor = lookups[accessorPos];
        if (accessor?.type === 'String') {
          usedIds.add(accessor.value);
        } else if (name !== 'settings') {
          // Whole object passed around, or dynamic access: we cannot know what is read.
          passesWholeObject = true;
        }
      },

      async onCodePathEnd() {
        if (!ast || passesWholeObject) {
          return;
        }

        for (const { id, index } of declared) {
          if (usedIds.has(id)) {
            continue;
          }

          const idNode = nodeAtPath(ast, ['settings', index, 'id']);
          if (!idNode) {
            continue;
          }

          context.report({
            message: `The setting '${id}' is declared in the schema but never used.`,
            startIndex: offset + getLocStart(idNode),
            endIndex: offset + getLocEnd(idNode),
          });
        }
      },
    };
  },
};
