import { Line } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { SceneCanvas } from '@/components/three/SceneCanvas';
import { Label3D } from '@/components/three/Label3D';
import { LOSS_MINIMA, lossGradient, lossSurface } from '@/lib/landscape';
import { fmtFixed } from '@/lib/format';
import type { Vec3 } from '@/lib/vec3';
import { theme } from '@/styles/theme';
import type { SceneProps } from '../registry';
import type { SceneStore } from '../store';
import { Y_SCALE, parseTrail, placeBall } from './store';

const INITIAL = { position: [10, 8, 10] as Vec3, target: [0, 1.5, 0] as Vec3 };
const SIZE = 10;
const SEG = 80;

function buildSurface() {
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const low = new THREE.Color('#1e3a8a');
  const mid = new THREE.Color(theme.accent);
  const high = new THREE.Color(theme.warn);
  let min = Infinity;
  let max = -Infinity;
  const hs: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = lossSurface(x, z);
    hs.push(h);
    min = Math.min(min, h);
    max = Math.max(max, h);
  }
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, hs[i] * Y_SCALE);
    const t = (hs[i] - min) / (max - min);
    if (t < 0.5) c.copy(low).lerp(mid, t / 0.5);
    else c.copy(mid).lerp(high, (t - 0.5) / 0.5);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

function Ball({ store }: { store: SceneStore }) {
  const bx = store((s) => s.params.bx as number);
  const bz = store((s) => s.params.bz as number);
  const showGrad = store((s) => s.params.showGrad as boolean);
  const mesh = useRef<THREE.Mesh>(null);
  const arrow = useRef<THREE.ArrowHelper>(null);
  const target = useMemo(() => new THREE.Vector3(bx, lossSurface(bx, bz) * Y_SCALE + 0.18, bz), [bx, bz]);
  // Стартовая позиция задаётся один раз: если передавать target как проп, r3f будет телепортировать
  // шарик на каждом шаге, и плавного переката в useFrame не получится.
  const [initialPos] = useState(() => target.clone());
  const arrowArgs = useMemo(() => [new THREE.Vector3(1, 0, 0), initialPos, 1, new THREE.Color(theme.danger), 0.25, 0.15] as const, [initialPos]);
  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    const k = 1 - Math.exp(-12 * dt);
    m.position.lerp(target, k);
    const a = arrow.current;
    if (a) {
      const [gx, gz] = lossGradient(m.position.x, m.position.z);
      const dir = new THREE.Vector3(-gx, 0, -gz);
      const len = Math.min(1.6, dir.length() * 0.6);
      dir.normalize();
      const dy = (lossSurface(m.position.x + dir.x * 0.3, m.position.z + dir.z * 0.3) - lossSurface(m.position.x, m.position.z)) * Y_SCALE;
      dir.y = dy / 0.3;
      dir.normalize();
      a.position.copy(m.position);
      a.setDirection(dir);
      a.setLength(Math.max(len, 0.15), 0.25, 0.15);
    }
  });
  return (
    <>
      <mesh ref={mesh} position={initialPos}>
        <sphereGeometry args={[0.18, 24, 18]} />
        <meshStandardMaterial color={theme.text} emissive={theme.accent} emissiveIntensity={0.5} roughness={0.2} />
      </mesh>
      {showGrad && <arrowHelper ref={arrow} args={[...arrowArgs]} />}
    </>
  );
}

function Contents({ store }: { store: SceneStore }) {
  const geometry = useMemo(() => buildSurface(), []);
  const trailStr = store((s) => s.params.trail as string);
  const bx = store((s) => s.params.bx as number);
  const bz = store((s) => s.params.bz as number);
  const trail = useMemo(() => parseTrail(trailStr), [trailStr]);
  const [hover, setHover] = useState<{ x: number; z: number; l: number } | null>(null);
  const lastHover = useRef(0);
  const loss = lossSurface(bx, bz);
  const points = useMemo<Vec3[]>(() => trail.map(([x, z]) => [x, lossSurface(x, z) * Y_SCALE + 0.06, z]), [trail]);

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    const now = performance.now();
    if (now - lastHover.current < 60) return;
    lastHover.current = now;
    setHover({ x: e.point.x, z: e.point.z, l: lossSurface(e.point.x, e.point.z) });
  };

  return (
    <>
      <mesh
        geometry={geometry}
        onPointerMove={onMove}
        onPointerOut={() => setHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          placeBall(e.point.x, e.point.z);
        }}
      >
        <meshStandardMaterial vertexColors roughness={0.75} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geometry} position={[0, 0.01, 0]}>
        <meshBasicMaterial color="#0b0f19" wireframe transparent opacity={0.18} />
      </mesh>
      {points.length > 1 && <Line points={points} color={theme.text} lineWidth={2} transparent opacity={0.9} />}
      {points.map((p, i) => (i % 2 === 0 || i === points.length - 1 ? (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={theme.text} />
        </mesh>
      ) : null))}
      <Ball store={store} />
      <Label3D position={[bx, loss * Y_SCALE + 0.55, bz]} variant="accent">
        L = {fmtFixed(loss, 2)} · ({fmtFixed(bx, 1)}; {fmtFixed(bz, 1)})
      </Label3D>
      {hover && Math.hypot(hover.x - bx, hover.z - bz) > 0.6 && (
        <Label3D position={[hover.x, hover.l * Y_SCALE + 0.3, hover.z]} variant="muted">
          L = {fmtFixed(hover.l, 2)} — нажмите, чтобы поставить шарик
        </Label3D>
      )}
      <Label3D position={[LOSS_MINIMA.deep[0], lossSurface(...LOSS_MINIMA.deep) * Y_SCALE - 0.35, LOSS_MINIMA.deep[1]]} variant="muted">
        глубокий минимум
      </Label3D>
      <Label3D position={[LOSS_MINIMA.local[0], lossSurface(...LOSS_MINIMA.local) * Y_SCALE - 0.35, LOSS_MINIMA.local[1]]} variant="muted">
        локальный минимум
      </Label3D>
    </>
  );
}

export default function LossSurfaceScene({ store, active }: SceneProps) {
  return (
    <SceneCanvas store={store} active={active} camera={INITIAL} minDistance={3} maxDistance={35}>
      <Contents store={store} />
    </SceneCanvas>
  );
}
