// Reading order is left-to-right, then top-to-bottom. Never shrink tap targets
// to fit: a smaller home-screen card scrolls vertically instead.
export function widgetRows<T>(items: T[], columns = 2): T[][] {
  const count = columns === 1 ? 1 : 2;
  return Array.from({ length: Math.ceil(items.length / count) }, (_, row) => items.slice(row * count, row * count + count));
}
// Android LinearLayout weights include each child's intrinsic width/padding.
// An empty weighted spacer is therefore narrower than a padded medication card.
// Use identical explicit widths for real cards and the empty final cell.
export function widgetColumnWidth(width: number) {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 340;
  return Math.max(1, Math.floor((safeWidth - 24 - 6) / 2));
}
export function largeWidgetLayout(height: number) {
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 300;
  // Title + separate date line + summary/progress + footer + outer padding.
  const contentHeight = Math.max(44, safeHeight - 152);
  const rowGap = 5;
  const rowHeight = Math.max(44, Math.min(58, Math.floor(contentHeight / 5) - rowGap));
  return { contentHeight, rowHeight, rowGap };
}
