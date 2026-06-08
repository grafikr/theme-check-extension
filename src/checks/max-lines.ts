import {
  SchemaProp,
  Severity,
  SourceCodeType,
} from '@shopify/theme-check-common';
import type { LiquidCheckDefinition } from '@shopify/theme-check-common';

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
      description:
        'Enforce a maximum number of lines per file to keep files focused and maintainable.',
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
          if (skipBlankLines && line.trim() === '') continue;

          if (skipComments) {
            if (state === 'inBlockComment') {
              if (blockCommentEndRe.test(line)) state = 'normal';
              continue;
            }

            if (state === 'inLiquidTag') {
              if (liquidTagCloseRe.test(line)) {
                // Closing %} — the whole block was comments; discard buffer
                liquidTagBuffer = [];
                state = 'normal';
                continue;
              }
              if (liquidCommentLineRe.test(line)) {
                liquidTagBuffer.push(i);
                continue;
              }
              // Non-comment line inside the tag — not a comment block; flush buffer
              countingLineIndices.push(...liquidTagBuffer);
              liquidTagBuffer = [];
              state = 'normal';
              // fall through to count the current line
            }

            // state === 'normal'
            if (blockCommentStartRe.test(line)) {
              if (!blockCommentEndRe.test(line)) state = 'inBlockComment';
              continue;
            }
            if (inlineCommentRe.test(line)) continue;
            if (liquidTagOpenRe.test(line)) {
              liquidTagBuffer = [i];
              state = 'inLiquidTag';
              continue;
            }
            if (htmlCommentRe.test(line)) continue;
          }

          countingLineIndices.push(i);
        }

        // File ended while buffering a liquid tag that turned out not to be a comment block
        if (liquidTagBuffer.length > 0) {
          countingLineIndices.push(...liquidTagBuffer);
        }

        if (countingLineIndices.length <= max) return;

        const excessLineIndex = countingLineIndices[max]!;
        const excessLine = lines[excessLineIndex]!;
        const startIndex = lines
          .slice(0, excessLineIndex)
          .reduce((acc, l) => acc + l.length + 1, 0);

        context.report({
          message: `File has too many lines (${countingLineIndices.length}). Maximum allowed is ${max}.`,
          startIndex,
          endIndex: startIndex + excessLine.length,
        });
      },
    };
  },
};
