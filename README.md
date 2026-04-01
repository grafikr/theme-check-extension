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

For more configuration options, see the [Theme Check configuration docs](https://shopify.dev/docs/storefronts/themes/tools/theme-check/configuration).

## Checks

| Check                     | Description                        | Applies to    | Default severity |
| ------------------------- | ---------------------------------- | ------------- | ---------------- |
| `DeprecateSectionBlocks` | Warns against using section blocks | Section files | `warning`        |
