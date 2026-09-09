import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { theme } from '@/styles/theme';

interface Props {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  color: string;
  emissive?: number;
  opacity?: number;
  onPointerOver?: (e: import('@react-three/fiber').ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: import('@react-three/fiber').ThreeEvent<PointerEvent>) => void;
  onClick?: (e: import('@react-three/fiber').ThreeEvent<MouseEvent>) => void;
}

/** Столбик с плавно анимируемой высотой (основание на y = 0). */
export function Bar3D({ x, z, width, depth, height, color, emissive = 0, opacity = 1, onPointerOver, onPointerOut, onClick }: Props) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const current = useRef(0.001);
  const targetColor = useRef(new THREE.Color(color));
  useEffect(() => {
    targetColor.current.set(color);
  }, [color]);
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-8 * dt);
    current.current += (Math.max(height, 0.01) - current.current) * k;
    const m = mesh.current;
    if (m) {
      m.scale.y = current.current;
      m.position.y = current.current / 2;
    }
    if (mat.current) {
      mat.current.color.lerp(targetColor.current, k);
      mat.current.emissive.copy(mat.current.color).multiplyScalar(emissive);
    }
  });
  return (
    <mesh ref={mesh} position={[x, 0, z]} onPointerOver={onPointerOver} onPointerOut={onPointerOut} onClick={onClick}>
      <boxGeometry args={[width, 1, depth]} />
      <meshStandardMaterial ref={mat} color={color} transparent={opacity < 1} opacity={opacity} roughness={0.5} metalness={0.1} emissive={theme.bg} />
    </mesh>
  );
}
