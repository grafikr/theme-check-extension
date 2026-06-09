import type { LiquidCheckDefinition } from '@shopify/theme-check-common';
import { SchemaProp, Severity, SourceCodeType } from '@shopify/theme-check-common';

const schema = {
  max: SchemaProp.number(300),
  skipBlankLines: SchemaProp.boolean(false),
  skipComments: SchemaProp.boolean(false),
};

// {% comment %}...{% endcomment %}
const blockCommentStartRe = /\{%-?\s*comment\s*-?%\}/;
const blockCommentEndRe = /\{%-?\s*endcomment\s*-?%\}/;

// {% # inline comment %}
const inlineCommentRe = /^\s*\{%-?\s*#.*-?%\}\s*$/;

// Opening line of a multi-line tag: just {%  or  {%-  with optional whitespace
const liquidTagOpenRe = /^\s*\{%-?\s*$/;

// Lines inside a multi-line tag that are comments: leading whitespace then #
const liquidCommentLineRe = /^\s*#/;

// Closing line of a multi-line tag: %}  or  -%}
const liquidTagCloseRe = /^\s*-?%\}\s*$/;

// <!-- HTML comment on its own line -->
const htmlCommentRe = /^\s*<!--.*-->\s*$/;

type State = 'normal' | 'inBlockComment' | 'inLiquidTag';

export const MaxLines: LiquidCheckDefinition<typeof schema> = {
  meta: {
    code: 'MaxLines',
    name: 'Max Lines',
    docs: {
      description: 'Enforce a maximum number of lines per file to keep files focused and maintainable.',
      recommended: false,
    },
    type: SourceCodeType.LiquidHtml,
    severity: Severity.WARNING,
    schema,
  },

  create(context) {
    return {
      async onCodePathStart(file) {
        const { max, skipBlankLines, skipComments } = context.settings;
        const lines = file.source.split('\n');

        let state: State = 'normal';
        // Lines buffered while we determine if a {%...%} block is a comment block.
        // Flushed to countingLineIndices if a non-comment line appears inside.
        let liquidTagBuffer: number[] = [];
        const countingLineIndices: number[] = [];

        for (const [i, line] of lines.entries()) {
          const isBlank = skipBlankLines && line.trim() === '';

          if (!isBlank) {
            let shouldCount = true;

            if (skipComments) {
              if (state === 'inBlockComment') {
                if (blockCommentEndRe.test(line)) state = 'normal';
                shouldCount = false;
              } else if (state === 'inLiquidTag') {
                if (liquidTagCloseRe.test(line)) {
                  // Closing %} — the whole block was comments; discard buffer
                  liquidTagBuffer = [];
                  state = 'normal';
                  shouldCount = false;
                } else if (liquidCommentLineRe.test(line)) {
                  liquidTagBuffer.push(i);
                  shouldCount = false;
                } else {
                  // Non-comment line inside the tag — not a comment block; flush buffer
                  countingLineIndices.push(...liquidTagBuffer);
                  liquidTagBuffer = [];
                  state = 'normal';
                }
              } else if (blockCommentStartRe.test(line)) {
                if (!blockCommentEndRe.test(line)) state = 'inBlockComment';
                shouldCount = false;
              } else if (inlineCommentRe.test(line)) {
                shouldCount = false;
              } else if (liquidTagOpenRe.test(line)) {
                liquidTagBuffer = [i];
                state = 'inLiquidTag';
                shouldCount = false;
              } else if (htmlCommentRe.test(line)) {
                shouldCount = false;
              }
            }

            if (shouldCount) {
              countingLineIndices.push(i);
            }
          }
        }

        // File ended while buffering a liquid tag that turned out not to be a comment block
        if (liquidTagBuffer.length > 0) {
          countingLineIndices.push(...liquidTagBuffer);
        }

        if (countingLineIndices.length > max) {
          const excessLineIndex = countingLineIndices.at(max);
          const excessLine = excessLineIndex !== undefined ? lines.at(excessLineIndex) : undefined;

          if (excessLineIndex !== undefined && excessLine !== undefined) {
            const startIndex = lines.slice(0, excessLineIndex).reduce((acc, l) => acc + l.length + 1, 0);

            context.report({
              message: `File has too many lines (${countingLineIndices.length}). Maximum allowed is ${max}.`,
              startIndex,
              endIndex: startIndex + excessLine.length,
            });
          }
        }
      },
    };
  },
};
