import { useMemo } from 'react';

let cached: boolean | null = null;

export function detectWebGL(): boolean {
  if (cached !== null) return cached;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    cached = !!gl;
  } catch {
    cached = false;
  }
  return cached;
}

export function useWebGLSupport(): boolean {
  return useMemo(() => detectWebGL(), []);
}
