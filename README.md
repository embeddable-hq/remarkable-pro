# Remarkable PRO is Embeddable’s production-ready component suite.

Remarkable PRO is component library to use inside of [Embeddable](https://embeddable.com/).

It provides [Embeddable](https://embeddable.com/) ready-to-go components, editors and granular styling via CSS variables inside the theme.

Under the hood it uses the open source [Remarkable UI](https://www.npmjs.com/package/@embeddable.com/remarkable-ui) library.

## 📦 Installation

```bash
npm install @embeddable.com/remarkable-pro
```

## 🧩 Setup (embeddable.config.ts)

```ts
export default defineConfig({
  ...
  componentLibraries: ["@embeddable.com/remarkable-pro"]
});
```

## 🚀 Remarkable PRO includes

- All core visualisations: bar, line, pie/donut, KPI tiles, tables, heatmaps, etc.
- All essential controls: dropdowns, multi-selects, date pickers (UTC-safe), and - custom filters.
- In-built interactivity: every chart supports click to filter.
- i18n: internationalisation, built-in.
- Consistent colors: automatic color-value assignment. And lots more.

## 🎨 Theme styling

The components and editors are part of the [Remarkable UI](https://www.npmjs.com/package/@embeddable.com/remarkable-ui) library, that uses its own [design system](https://github.com/embeddable-hq/remarkable-ui/blob/main/src/styles/global.tokens.ts) to style them.

To update this styles, simply specify your css variable overrides inside your root embeddable.theme.ts file.

```ts
const themeProvider = (clientContext: any, parentTheme: Theme): Theme => {
  const newTheme: DeepPartial<Theme> = {
    styles: {
      '--em-button-background--primary': 'gray',
      '--em-card-border-radius': '20px',
      ...
    },
  };
  const theme = defineTheme(parentTheme, newTheme) as Theme;
  return theme;
};
```

## 📁 Project Structure

```
src/
  assets/        # Icons and static assets
  components/    # Chart, table, editor components
  editors/       # Editor components and utilities
  theme/         # Theme constants, types, and utils
  types/         # Shared TypeScript types
  utils.ts/      # Utility functions
```

## 🛠 Contributing

We welcome feedback and contributions!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

Please follow our code style and add tests for new features.

## 📄 License

MIT — see the `LICENSE` file for details.
