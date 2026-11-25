import { DeprecateSectionBlocks } from './checks/deprecate-section-blocks.js';
import { MaxLines } from './checks/max-lines.js';
import { MaxSchemaSettings } from './checks/max-schema-settings.js';

import { NoInlineStyle } from './checks/no-inline-style.js';

export const checks = [DeprecateSectionBlocks, MaxLines, MaxSchemaSettings, NoInlineStyle];
