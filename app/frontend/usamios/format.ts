/** Fills "%{name}" placeholders, the same syntax the Rails locale files use. */
export const fill = (template: string, values: Record<string, string>) =>
  template.replace(/%\{(\w+)\}/g, (_, key: string) => values[key] ?? "")
