import { Html } from '@react-three/drei';
import type { ReactNode } from 'react';
import type { Vec3 } from '@/lib/vec3';

interface Props {
  position: Vec3;
  children: ReactNode;
  variant?: 'default' | 'muted' | 'accent' | 'cluster';
  offsetY?: number;
  distanceFactor?: number;
  style?: React.CSSProperties;
}

/** Подпись в 3D через DOM (drei Html) — так кириллица рисуется системным шрифтом без загрузки шрифтов для WebGL. */
export function Label3D({ position, children, variant = 'default', offsetY = 0, distanceFactor, style }: Props) {
  return (
    <Html position={[position[0], position[1] + offsetY, position[2]]} center zIndexRange={[10, 0]} distanceFactor={distanceFactor} style={{ pointerEvents: 'none' }}>
      <div className={`label3d${variant !== 'default' ? ` label3d--${variant}` : ''}`} style={style}>
        {children}
      </div>
    </Html>
  );
}
