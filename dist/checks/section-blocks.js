import { getLocEnd, getLocStart, getSchema, isSection, nodeAtPath, Severity, SourceCodeType, } from '@shopify/theme-check-common';
export const DiscourageSectionBlocks = {
    meta: {
        code: 'DiscourageSectionBlocks',
        name: 'Discourage Section Blocks',
        docs: {
            description: 'This check discourages the use of section blocks.',
            recommended: true,
        },
        type: SourceCodeType.LiquidHtml,
        severity: Severity.WARNING,
        schema: {},
    },
    create(context) {
        if (!isSection(context.file.uri)) {
            return {};
        }
        return {
            async LiquidRawTag(node) {
                if (node.name !== 'schema' || node.body.kind !== 'json') {
                    return;
                }
                const { ast, validSchema } = (await getSchema(context)) ?? {};
                if (!ast ||
                    ast instanceof Error ||
                    !validSchema ||
                    validSchema instanceof Error) {
                    return;
                }
                const offset = node.blockStartPosition.start;
                validSchema.blocks?.forEach((block, index) => {
                    if (!('settings' in block)) {
                        return;
                    }
                    const astNode = nodeAtPath(ast, ['blocks', index, 'type']);
                    if (!astNode) {
                        return;
                    }
                    context.report({
                        message: 'Consider using a ThemeBlock instead of a SectionBlock.',
                        startIndex: offset + getLocStart(astNode),
                        endIndex: offset + getLocEnd(astNode),
                    });
                });
            },
        };
    },
};
