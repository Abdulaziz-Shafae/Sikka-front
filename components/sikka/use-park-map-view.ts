'use client';
import { useEffect, useRef, useState, type PointerEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { constrainMapView, fitMapView, getMapBounds, zoomMapAt, type MapPoint, type MapView } from '@/lib/park-map-geometry';
export function useParkMapView(points: MapPoint[]) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [view, setView] = useState<MapView>({ x: 0, y: 0, scale: 1 });
  const sizeRef = useRef(size), viewRef = useRef(view), fitRef = useRef(view), autoFit = useRef(true);
  const pointers = useRef(new Map<number, { current: MapPoint; start: MapPoint }>());
  const moved = useRef(false), suppressClickUntil = useRef(0);
  const bounds = getMapBounds(points);
  function applyView(next: MapView) {
    const limited = constrainMapView(next, sizeRef.current, bounds);
    viewRef.current = limited; setView(limited);
  }
  function fit() { autoFit.current = true; applyView(fitRef.current); }
  function zoomAt(factor: number, anchor: MapPoint) {
    autoFit.current = false;
    applyView(zoomMapAt(viewRef.current, factor, anchor, fitRef.current.scale * .65, fitRef.current.scale * 12));
  }
  function zoomToPoints(targets: MapPoint[]) {
    const b = getMapBounds(targets);
    const fitted = fitMapView(targets, sizeRef.current, 85);
    const scale = Math.min(fitRef.current.scale * 12, Math.max(viewRef.current.scale * 1.6, fitted.scale));
    autoFit.current = false;
    applyView({ scale, x: sizeRef.current.width / 2 - (b.minX + b.maxX) / 2 * scale, y: sizeRef.current.height / 2 - (b.minY + b.maxY) / 2 * scale });
  }
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const nextSize = { width: entry.contentRect.width, height: entry.contentRect.height };
      const previous = sizeRef.current;
      const fitted = fitMapView(points, nextSize);
      fitRef.current = fitted; sizeRef.current = nextSize; setSize(nextSize);
      if (autoFit.current || !previous.width) applyView(fitted);
      else {
        const current = viewRef.current;
        const center = { x: (previous.width / 2 - current.x) / current.scale, y: (previous.height / 2 - current.y) / current.scale };
        const scale = Math.min(fitted.scale * 12, Math.max(fitted.scale * .65, current.scale));
        applyView({ scale, x: nextSize.width / 2 - center.x * scale, y: nextSize.height / 2 - center.y * scale });
      }
    });
    observer.observe(element);
    function wheel(event: WheelEvent) {
      const rect = element!.getBoundingClientRect();
      if (event.ctrlKey || event.metaKey || event.deltaMode !== 0) {
        event.preventDefault();
        zoomAt(Math.exp(-event.deltaY * (event.deltaMode === 0 ? .012 : .05)), { x: event.clientX - rect.left, y: event.clientY - rect.top });
      } else {
        const next=constrainMapView({...viewRef.current,x:viewRef.current.x-event.deltaX,y:viewRef.current.y-event.deltaY},sizeRef.current,bounds);
        if(Math.abs(next.x-viewRef.current.x)>.1||Math.abs(next.y-viewRef.current.y)>.1){event.preventDefault();autoFit.current=false;applyView(next);}
      }
    }
    element.addEventListener('wheel', wheel, { passive: false });
    return () => { observer.disconnect(); element.removeEventListener('wheel', wheel); };
  }, [points]);
  function localPoint(event: PointerEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>) {
    const r = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - r.left, y: event.clientY - r.top };
  }
  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const point = localPoint(event);
    if (!pointers.current.size) moved.current = false;
    pointers.current.set(event.pointerId, { current: point, start: point });
    if (!(event.target as Element).closest('button')) event.currentTarget.focus({ preventScroll: true });
    if (pointers.current.size > 1) {
      moved.current = true;
      pointers.current.forEach((_, id) => { try { event.currentTarget.setPointerCapture(id); } catch {} });
    }
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const pointer = pointers.current.get(event.pointerId);
    if (!pointer) return;
    const before = [...pointers.current.values()].map(p => p.current);
    const point = localPoint(event);
    pointers.current.set(event.pointerId, { ...pointer, current: point });
    const after = [...pointers.current.values()].map(p => p.current);
    if (after.length > 1) {
      const middle = (ps: MapPoint[]) => ({ x: (ps[0].x + ps[1].x) / 2, y: (ps[0].y + ps[1].y) / 2 });
      const previousMiddle = middle(before), nextMiddle = middle(after);
      const distance = (ps: MapPoint[]) => Math.hypot(ps[1].x - ps[0].x, ps[1].y - ps[0].y);
      const next = zoomMapAt(viewRef.current, distance(after) / Math.max(1, distance(before)), previousMiddle, fitRef.current.scale * .65, fitRef.current.scale * 12);
      autoFit.current = false; moved.current = true;
      applyView({ ...next, x: next.x + nextMiddle.x - previousMiddle.x, y: next.y + nextMiddle.y - previousMiddle.y });
    } else {
      if (!moved.current && Math.hypot(point.x - pointer.start.x, point.y - pointer.start.y) < 4) return;
      moved.current = true; autoFit.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
      applyView({ ...viewRef.current, x: viewRef.current.x + point.x - pointer.current.x, y: viewRef.current.y + point.y - pointer.current.y });
    }
    event.preventDefault();
  }
  function onPointerEnd(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    if (moved.current) suppressClickUntil.current = Date.now() + 350;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const center = { x: sizeRef.current.width / 2, y: sizeRef.current.height / 2 };
    if (['+', '=', '-', '0', 'Home', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) event.preventDefault();
    if (event.key === '+' || event.key === '=') zoomAt(1.3, center);
    else if (event.key === '-') zoomAt(1 / 1.3, center);
    else if (event.key === '0' || event.key === 'Home') fit();
    else if (event.key.startsWith('Arrow')) {
      autoFit.current = false;
      applyView({ ...viewRef.current, x: viewRef.current.x + (event.key === 'ArrowLeft' ? 45 : event.key === 'ArrowRight' ? -45 : 0), y: viewRef.current.y + (event.key === 'ArrowUp' ? 45 : event.key === 'ArrowDown' ? -45 : 0) });
    }
  }
  return { viewportRef, size, view, fit, zoomToPoints, handlers: {
    onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd,
    onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => { pointers.current.delete(event.pointerId); },
    onClickCapture: (event: MouseEvent<HTMLDivElement>) => { if (event.detail > 0 && Date.now() < suppressClickUntil.current) { event.preventDefault(); event.stopPropagation(); } },
    onDoubleClick: (event: MouseEvent<HTMLDivElement>) => { if (!(event.target as Element).closest('button')) zoomAt(1.6, localPoint(event)); },
    onKeyDown,
  } };
}
