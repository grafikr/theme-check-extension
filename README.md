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

| Check                    | Description                                 | Applies to    | Default severity | Enabled by default |
| ------------------------ | ------------------------------------------- | ------------- | ---------------- | ------------------ |
| `DeprecateSectionBlocks` | Warns against using section blocks          | Section files | `warning`        | Yes                |
| `MaxLines`               | Enforces a maximum number of lines per file | Liquid files  | `warning`        | Yes                |

### MaxLines

Enforces a maximum number of lines per file to keep files focused and maintainable. Override settings in your `.theme-check.yml`:

```yaml
MaxLines:
  enabled: true
  max: 300 # maximum number of lines (default: 300)
  skipBlankLines: false # ignore blank/whitespace-only lines (default: false)
  skipComments: false # ignore Liquid comment blocks and HTML comment lines (default: false)
```

When `skipComments` is enabled, the following are excluded from the line count:

- Lines containing `{% comment %}` or `{% endcomment %}` tags
- Lines between `{% comment %}` and `{% endcomment %}`
- Lines consisting solely of an HTML comment (`<!-- ... -->`)
