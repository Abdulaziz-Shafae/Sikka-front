export type MapPoint = { x: number; y: number };
export type MapView = MapPoint & { scale: number };
export type ViewportSize = { width: number; height: number };
export type MapBounds = { minX: number; minY: number; maxX: number; maxY: number };
export function getMapBounds(points: MapPoint[]): MapBounds {
  return { minX: Math.min(...points.map(p => p.x)), minY: Math.min(...points.map(p => p.y)), maxX: Math.max(...points.map(p => p.x)), maxY: Math.max(...points.map(p => p.y)) };
}
export function fitMapView(points: MapPoint[], size: ViewportSize, padding = 46): MapView {
  const b = getMapBounds(points);
  const scale = Math.min(Math.max(1, size.width - padding * 2) / Math.max(128, b.maxX - b.minX), Math.max(1, size.height - padding * 2) / Math.max(128, b.maxY - b.minY));
  return { scale, x: size.width / 2 - (b.minX + b.maxX) / 2 * scale, y: size.height / 2 - (b.minY + b.maxY) / 2 * scale };
}
export function zoomMapAt(view: MapView, factor: number, anchor: MapPoint, min: number, max: number): MapView {
  const scale = Math.min(max, Math.max(min, view.scale * factor));
  const ratio = scale / view.scale;
  return { scale, x: anchor.x - (anchor.x - view.x) * ratio, y: anchor.y - (anchor.y - view.y) * ratio };
}
export function constrainMapView(view: MapView, size: ViewportSize, b: MapBounds): MapView {
  const padding = 36;
  const clampAxis = (offset: number, min: number, max: number, length: number) => (max - min) * view.scale < length - padding * 2
    ? length / 2 - (min + max) / 2 * view.scale
    : Math.max(padding - max * view.scale, Math.min(length - padding - min * view.scale, offset));
  return { scale: view.scale, x: clampAxis(view.x, b.minX, b.maxX, size.width), y: clampAxis(view.y, b.minY, b.maxY, size.height) };
}
export function clusterMapMarkers<T extends MapPoint & { id: string }>(markers: T[], view: MapView, size: ViewportSize, distance = 44) {
  const visible = markers.map(marker => ({ marker, x: marker.x * view.scale + view.x, y: marker.y * view.scale + view.y }))
    .filter(p => p.x > -28 && p.x < size.width + 28 && p.y > -28 && p.y < size.height + 28);
  const parents = visible.map((_, i) => i);
  const root = (i: number): number => parents[i] === i ? i : (parents[i] = root(parents[i]));
  visible.forEach((a, i) => visible.slice(i + 1).forEach((b, offset) => {
    if (Math.hypot(a.x - b.x, a.y - b.y) < distance) parents[root(i + offset + 1)] = root(i);
  }));
  const groups = new Map<number, typeof visible>();
  visible.forEach((p, i) => { const key = root(i); groups.set(key, [...(groups.get(key) || []), p]); });
  return [...groups.values()].map(group => ({ items: group.map(p => p.marker), x: group.reduce((sum, p) => sum + p.x, 0) / group.length, y: group.reduce((sum, p) => sum + p.y, 0) / group.length }));
}
