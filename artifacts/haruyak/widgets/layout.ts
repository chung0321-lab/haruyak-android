// Five two-column rows leave ten independent, 44dp-or-larger tap targets
// visible even at the large widget's minimum 250dp height.
export function widgetRows<T>(items: T[]): T[][] {
  return Array.from({ length: Math.ceil(items.length / 2) }, (_, row) => items.slice(row * 2, row * 2 + 2));
}
export function largeWidgetLayout(height: number) {
  const contentHeight = Math.max(44, height - 16);
  const rowGap = 2;
  const rowHeight = Math.max(44, Math.floor(contentHeight / 5) - rowGap);
  return { contentHeight, rowHeight, rowGap };
}
