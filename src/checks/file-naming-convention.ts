import type { LiquidCheckDefinition } from '@shopify/theme-check-common';
import { isBlock, isSection, isSnippet, SchemaProp, Severity, SourceCodeType } from '@shopify/theme-check-common';

const KEBAB_CASE = '[a-z0-9]+(-[a-z0-9]+)*';

const schema = {
  snippets: SchemaProp.string(`^_?${KEBAB_CASE}$`),
  blocks: SchemaProp.string(`^_?${KEBAB_CASE}$`),
  sections: SchemaProp.string(`^${KEBAB_CASE}$`),
};

type Directory = keyof typeof schema;

function getDirectory(uri: string): Directory | undefined {
  if (isSnippet(uri)) return 'snippets';
  if (isBlock(uri)) return 'blocks';
  if (isSection(uri)) return 'sections';
  return undefined;
}

/** Returns the file name without directories and the `.liquid` extension. */
function getBasename(uri: string): string {
  const name = decodeURIComponent(uri.split('/').pop() ?? '');
  return name.replace(/\.liquid$/, '');
}

export const FileNamingConvention: LiquidCheckDefinition<typeof schema> = {
  meta: {
    code: 'FileNamingConvention',
    name: 'File Naming Convention',
    docs: {
      description: 'Enforce file name conventions for snippets, blocks and sections.',
      recommended: true,
    },
    type: SourceCodeType.LiquidHtml,
    severity: Severity.WARNING,
    schema,
  },

  create(context) {
    const directory = getDirectory(context.file.uri);
    if (!directory) return {};

    const pattern = context.settings[directory];
    const basename = getBasename(context.file.uri);

    return {
      async onCodePathStart() {
        let regex: RegExp;
        try {
          regex = new RegExp(pattern);
        } catch {
          context.report({
            message: `Invalid regular expression for the "${directory}" setting of FileNamingConvention: ${pattern}`,
            startIndex: 0,
            endIndex: 1,
          });
          return;
        }

        if (regex.test(basename)) return;

        context.report({
          message: `File name "${basename}" in ${directory}/ does not match the expected pattern ${pattern}`,
          startIndex: 0,
          endIndex: 1,
        });
      },
    };
  },
};
