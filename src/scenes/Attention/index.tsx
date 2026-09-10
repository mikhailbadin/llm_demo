import { Grid } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SceneCanvas } from '@/components/three/SceneCanvas';
import { Label3D } from '@/components/three/Label3D';
import { Bar3D } from '@/components/three/Bar3D';
import { useHoverable } from '@/components/three/useHoverable';
import { ATTENTION_EXAMPLES } from '@/data/attentionExamples';
import { scoresToWeights } from '@/lib/attention';
import { fmtFixed } from '@/lib/format';
import type { Vec3 } from '@/lib/vec3';
import { mixHex, theme } from '@/styles/theme';
import type { SceneProps } from '../registry';
import type { SceneStore } from '../store';

const INITIAL = { position: [0, 5, 11] as Vec3, target: [0, 0.6, 0] as Vec3 };
const HEAD_COLORS = [theme.accent2, theme.accent];

function tokenPos(i: number, n: number): Vec3 {
  const x = (i - (n - 1) / 2) * 1.35;
  return [x, 0, -0.05 * x * x];
}

function TokenSphere({ store, i, n, label, isQuery }: { store: SceneStore; i: number; n: number; label: string; isQuery: boolean }) {
  const id = `t${i}`;
  const handlers = useHoverable(store, id);
  const hovered = store((s) => s.hoveredId === id);
  const highlight = store((s) => s.highlight);
  const dimmed = highlight.length > 0 && !highlight.includes(id);
  const pos = tokenPos(i, n);
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const targetY = isQuery ? 0.6 : 0;
  const targetColor = useMemo(() => new THREE.Color(isQuery ? theme.warn : dimmed ? mixHex(theme.blue, theme.bg, 0.75) : theme.blue), [isQuery, dimmed]);
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-10 * dt);
    if (mesh.current) {
      mesh.current.position.y += (targetY - mesh.current.position.y) * k;
      const ts = hovered ? 1.25 : 1;
      mesh.current.scale.setScalar(mesh.current.scale.x + (ts - mesh.current.scale.x) * k);
    }
    if (mat.current) {
      mat.current.color.lerp(targetColor, k);
      mat.current.emissive.copy(mat.current.color).multiplyScalar(isQuery ? 0.7 : hovered ? 0.35 : 0.1);
    }
  });
  return (
    <>
      <mesh ref={mesh} position={pos} {...handlers}>
        <sphereGeometry args={[0.3, 24, 18]} />
        <meshStandardMaterial ref={mat} color={theme.blue} roughness={0.35} emissive={theme.blue} />
      </mesh>
      <Label3D position={[pos[0], pos[1] + (isQuery ? 0.6 : 0), pos[2]]} offsetY={0.6} variant={isQuery ? 'accent' : 'default'}>
        {label}
      </Label3D>
    </>
  );
}

interface TubeProps {
  store: SceneStore;
  /** индексы запроса и ключа, число токенов и сдвиг по z — примитивы, чтобы геометрия не пересоздавалась на каждый рендер */
  qi: number;
  j: number;
  n: number;
  zOff: number;
  weight: number;
  color: string;
  id: string;
  label: string;
}

function Tube({ store, qi, j, n, zOff, weight, color, id, label }: TubeProps) {
  const handlers = useHoverable(store, id, false);
  const hovered = store((s) => s.hoveredId === id);
  const highlight = store((s) => s.highlight);
  const dimmed = highlight.length > 0 && !highlight.includes(id);
  const { geometry, mid } = useMemo(() => {
    const p = tokenPos(qi, n);
    const q = tokenPos(j, n);
    const from: Vec3 = [p[0], 0.6, p[2] + zOff];
    const to: Vec3 = [q[0], 0.05, q[2] + zOff];
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const m = a.clone().add(b).multiplyScalar(0.5);
    m.y += 0.9 + 0.3 * a.distanceTo(b);
    const curve = new THREE.QuadraticBezierCurve3(a, m, b);
    const mid: Vec3 = [(from[0] + to[0]) / 2, Math.max(from[1], to[1]) + 0.9 + 0.3 * Math.hypot(from[0] - to[0], from[2] - to[2]) * 0.75, (from[2] + to[2]) / 2];
    return { geometry: new THREE.TubeGeometry(curve, 28, 0.025 + 0.17 * weight, 10, false), mid };
  }, [qi, j, n, zOff, weight]);
  return (
    <>
      <mesh geometry={geometry} {...handlers}>
        <meshStandardMaterial color={color} transparent opacity={dimmed ? 0.12 : 0.35 + 0.65 * weight} emissive={color} emissiveIntensity={hovered ? 0.8 : 0.3} roughness={0.4} />
      </mesh>
      {hovered && (
        <Label3D position={mid} variant="accent">
          {label}
        </Label3D>
      )}
    </>
  );
}

function Contents({ store }: { store: SceneStore }) {
  const exampleId = store((s) => s.params.example as string);
  const head = store((s) => s.params.head as number);
  const causal = store((s) => s.params.causal as boolean);
  const allHeads = store((s) => s.params.allHeads as boolean);
  const selectedId = store((s) => s.selectedId);
  const hoveredId = store((s) => s.hoveredId);
  const highlight = store((s) => s.highlight);

  const example = ATTENTION_EXAMPLES.find((e) => e.id === exampleId) ?? ATTENTION_EXAMPLES[0];
  const n = example.tokens.length;
  // Выбранный токен может остаться от более длинного примера — за границы не выходим.
  const selectedIdx = selectedId && selectedId.startsWith('t') ? Number(selectedId.slice(1)) : NaN;
  const qi = Number.isInteger(selectedIdx) && selectedIdx >= 0 && selectedIdx < n ? selectedIdx : null;
  const weightsByHead = useMemo(() => example.heads.map((h) => scoresToWeights(h.scores, causal)), [example, causal]);
  const heads = allHeads ? [0, 1] : [head];

  const barWeights = qi !== null ? weightsByHead[head][qi] : null;
  const hoveredBar = hoveredId && hoveredId.startsWith('bar:') ? Number(hoveredId.slice(4)) : null;

  return (
    <>
      <Grid position={[0, -0.35, 0]} args={[30, 30]} cellSize={0.5} sectionSize={2.5} cellColor="#1c2537" sectionColor="#2b3648" fadeDistance={30} fadeStrength={1.5} />
      {example.tokens.map((t, i) => (
        <TokenSphere key={`${example.id}-${i}`} store={store} i={i} n={n} label={t} isQuery={qi === i} />
      ))}

      {qi !== null &&
        heads.map((h) =>
          weightsByHead[h][qi].map((w, j) => {
            if (j === qi || w < 0.02) return null;
            const zOff = allHeads ? (h === 0 ? -0.35 : 0.35) : 0;
            const color = allHeads ? HEAD_COLORS[h] : mixHex(theme.accent2, theme.warn, w);
            return (
              <Tube
                key={`${example.id}-${h}-${qi}-${j}-${causal}`}
                store={store}
                qi={qi}
                j={j}
                n={n}
                zOff={zOff}
                weight={w}
                color={color}
                id={`edge:${h}:${qi}-${j}`}
                label={`${example.tokens[qi]} → ${example.tokens[j]}: ${fmtFixed(w, 2)}${allHeads ? ` (голова ${h + 1})` : ''}`}
              />
            );
          }),
        )}

      {qi !== null && (
        <mesh position={[tokenPos(qi, n)[0], 0.6, tokenPos(qi, n)[2]]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.42, 0.02 + 0.12 * weightsByHead[head][qi][qi], 10, 40]} />
          <meshStandardMaterial color={theme.warn} emissive={theme.warn} emissiveIntensity={0.5} transparent opacity={0.9} />
        </mesh>
      )}

      {example.tokens.map((_, j) => {
        const p = tokenPos(j, n);
        const w = barWeights ? barWeights[j] : 0;
        const id = `bar:${j}`;
        const dimmed = highlight.length > 0 && !highlight.includes(id);
        const masked = causal && qi !== null && j > qi;
        return (
          <Bar3D
            key={id}
            x={p[0]}
            z={p[2] + 1.1}
            width={0.5}
            depth={0.35}
            height={masked ? 0.02 : 2.2 * w}
            color={masked ? theme.border2 : dimmed ? mixHex(theme.accent, theme.bg, 0.7) : theme.accent}
            emissive={hoveredBar === j ? 0.6 : 0.15}
            onPointerOver={(e) => {
              e.stopPropagation();
              store.getState().setHovered(id);
            }}
            onPointerOut={() => {
              if (store.getState().hoveredId === id) store.getState().setHovered(null);
            }}
          />
        );
      })}
      {hoveredBar !== null && barWeights && qi !== null && (
        <Label3D position={[tokenPos(hoveredBar, n)[0], 2.2 * barWeights[hoveredBar] + 0.1, tokenPos(hoveredBar, n)[2] + 1.1]} variant="accent" offsetY={0.3}>
          {causal && hoveredBar > qi ? 'закрыто маской' : `вес ${example.tokens[qi]} → ${example.tokens[hoveredBar]}: ${fmtFixed(barWeights[hoveredBar], 2)}`}
        </Label3D>
      )}
      {qi === null && (
        <Label3D position={[0, 2.4, 0]} variant="muted">
          Нажмите на токен, чтобы увидеть его внимание
        </Label3D>
      )}
      {qi !== null && barWeights && (
        <Label3D position={[tokenPos(n - 1, n)[0] + 1.4, 0.4, tokenPos(n - 1, n)[2] + 1.1]} variant="muted">
          Σ весов = {fmtFixed(barWeights.reduce((s, w, j) => s + (causal && j > qi ? 0 : w), 0), 2)}
        </Label3D>
      )}
    </>
  );
}

export default function AttentionScene({ store, active }: SceneProps) {
  return (
    <SceneCanvas store={store} active={active} camera={INITIAL} minDistance={3} maxDistance={30}>
      <Contents store={store} />
    </SceneCanvas>
  );
}
