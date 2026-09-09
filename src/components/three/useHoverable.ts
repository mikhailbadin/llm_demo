import type { ThreeEvent } from '@react-three/fiber';
import { useCallback } from 'react';
import type { SceneStore } from '@/scenes/store';

/** Обработчики наведения/клика для объекта сцены с id: пишут hovered/selected в стор и меняют курсор. */
export function useHoverable(store: SceneStore, id: string, selectable = true) {
  const onPointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      store.getState().setHovered(id);
      document.body.style.cursor = selectable ? 'pointer' : 'default';
    },
    [store, id, selectable],
  );
  const onPointerOut = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (store.getState().hoveredId === id) store.getState().setHovered(null);
      document.body.style.cursor = '';
    },
    [store, id],
  );
  const onClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (selectable) store.getState().select(store.getState().selectedId === id ? null : id);
    },
    [store, id, selectable],
  );
  return { onPointerOver, onPointerOut, onClick };
}
