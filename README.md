# @grafikr/theme-check-extension

Opinionated Shopify theme linting checks built on top of [`@shopify/theme-check-common`](https://github.com/Shopify/theme-tools).

## Installation

```bash
pnpm i @grafikr/theme-check-extension -D
```

## Usage

Add the extension to your `.theme-check.yml` configuration:

```yaml
extends:
  - 'theme-check:recommended'
  - '@grafikr/theme-check-extension/recommended.yml'
```

## Checks

### `DiscourageSectionBlocks`

Warns againt using section blocks.

**Applies to:** Section files (`.liquid` files in the `sections/` directory)  
**Default severity:** `warning`

## Configuration

The recommended configuration is available at `@grafikr/theme-check-extension/recommended` and enables all checks with their default severities.

To customize individual checks in your `.theme-check.yml`:

```yaml
extends:
  - 'theme-check:recommended'
  - '@grafikr/theme-check-extension/recommended.yml'

DiscourageSectionBlocks:
  enabled: true
  severity: error
```
