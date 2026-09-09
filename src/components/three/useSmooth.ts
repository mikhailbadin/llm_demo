import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/** Плавно приближает число к цели каждый кадр; возвращает ref с текущим значением. */
export function useSmoothNumber(target: number, speed = 8) {
  const value = useRef(target);
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-speed * dt);
    value.current += (target - value.current) * k;
  });
  return value;
}

/** Плавно меняет цвет материала к целевому hex-цвету. */
export function useSmoothColor(ref: React.RefObject<THREE.MeshStandardMaterial | null>, targetHex: string, speed = 8) {
  const target = useRef(new THREE.Color(targetHex));
  useEffect(() => {
    target.current.set(targetHex);
  }, [targetHex]);
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    const k = 1 - Math.exp(-speed * dt);
    m.color.lerp(target.current, k);
  });
}
