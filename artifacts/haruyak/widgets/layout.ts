// Reading order is left-to-right, then top-to-bottom. Never shrink tap targets
// to fit: a smaller home-screen card scrolls vertically instead.
export function widgetRows<T>(items: T[], columns = 2): T[][] {
  const count = columns === 1 ? 1 : 2;
  return Array.from({ length: Math.ceil(items.length / count) }, (_, row) => items.slice(row * count, row * count + count));
}
export function largeWidgetLayout(height: number) {
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 300;
  // Title + separate date line + summary/progress + footer + outer padding.
  const contentHeight = Math.max(44, safeHeight - 140);
  const rowGap = 5;
  const rowHeight = Math.max(44, Math.min(58, Math.floor(contentHeight / 5) - rowGap));
  return { contentHeight, rowHeight, rowGap };
}
