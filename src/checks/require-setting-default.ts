import type { LiquidCheckDefinition, Setting } from '@shopify/theme-check-common';
import {
  getLocEnd,
  getLocStart,
  getSchema,
  isBlock,
  isSection,
  nodeAtPath,
  SchemaProp,
  Severity,
  SourceCodeType,
} from '@shopify/theme-check-common';

const schema = {
  types: SchemaProp.array(SchemaProp.string(), ['range', 'select', 'checkbox', 'radio', 'text_alignment']),
};

const DISPLAY_ONLY_TYPES = new Set<string>(['header', 'paragraph']);

export const RequireSettingDefault: LiquidCheckDefinition<typeof schema> = {
  meta: {
    code: 'RequireSettingDefault',
    name: 'Require Setting Default',
    docs: {
      description: 'Require settings of certain types to declare a default value in section and block schemas.',
      recommended: true,
    },
    type: SourceCodeType.LiquidHtml,
    severity: Severity.WARNING,
    schema,
  },

  create(context) {
    if (!isSection(context.file.uri) && !isBlock(context.file.uri)) {
      return {};
    }

    const types = new Set<string>((context.settings.types ?? []).filter((type) => !DISPLAY_ONLY_TYPES.has(type)));

    return {
      async LiquidRawTag(node) {
        if (node.name !== 'schema' || node.body.kind !== 'json') {
          return;
        }

        const { ast, validSchema } = (await getSchema(context)) ?? {};

        if (!ast || ast instanceof Error || !validSchema || validSchema instanceof Error) {
          return;
        }

        const offset = node.blockStartPosition.end;

        const checkSettings = (settings: Setting.Any[] | undefined, path: (string | number)[]) => {
          settings?.forEach((setting, index) => {
            if (!types.has(setting.type) || (setting as { default?: unknown }).default !== undefined) {
              return;
            }

            const astNode = nodeAtPath(ast, [...path, index, 'id']) ?? nodeAtPath(ast, [...path, index, 'type']);
            if (!astNode) {
              return;
            }

            context.report({
              message: `Setting '${setting.id ?? setting.type}' of type '${setting.type}' must declare a default value.`,
              startIndex: offset + getLocStart(astNode),
              endIndex: offset + getLocEnd(astNode),
            });
          });
        };

        checkSettings(validSchema.settings, ['settings']);
        validSchema.blocks?.forEach((block, index) => {
          if ('settings' in block) {
            checkSettings(block.settings, ['blocks', index, 'settings']);
          }
        });
      },
    };
  },
};
