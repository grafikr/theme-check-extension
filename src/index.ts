import { DeprecateSectionBlocks } from './checks/deprecate-section-blocks.js';
import { FileNamingConvention } from './checks/file-naming-convention.js';
import { MaxLines } from './checks/max-lines.js';
import { MaxSchemaSettings } from './checks/max-schema-settings.js';

export const checks = [DeprecateSectionBlocks, FileNamingConvention, MaxLines, MaxSchemaSettings];
