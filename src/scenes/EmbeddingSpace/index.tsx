import { Grid, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SceneCanvas } from '@/components/three/SceneCanvas';
import { Label3D } from '@/components/three/Label3D';
import { useHoverable } from '@/components/three/useHoverable';
import { CLUSTERS, EMBEDDING_WORDS, getCluster, getWord, type ClusterId } from '@/data/embeddings';
import { analogy, nearestWords } from '@/lib/embeddings';
import { add, sub, length, normalize, type Vec3 } from '@/lib/vec3';
import { fmtFixed } from '@/lib/format';
import { CLUSTER_COLORS, mixHex, theme } from '@/styles/theme';
import type { SceneProps } from '../registry';
import type { SceneStore } from '../store';

const INITIAL = { position: [11, 7, 11] as Vec3, target: [0, 0, 0] as Vec3 };
const sphereGeo = new THREE.SphereGeometry(0.17, 20, 16);

function clusterColor(id: ClusterId) {
  return CLUSTER_COLORS[getCluster(id).colorIndex];
}

function WordSphere({ store, id }: { store: SceneStore; id: string }) {
  const w = getWord(id);
  const handlers = useHoverable(store, id);
  const hovered = store((s) => s.hoveredId === id);
  const selected = store((s) => s.selectedId === id);
  const highlight = store((s) => s.highlight);
  const dimmed = highlight.length > 0 && !highlight.includes(id) && !highlight.includes(`cluster:${w.cluster}`);
  const base = clusterColor(w.cluster as ClusterId);
  const targetColor = useMemo(() => new THREE.Color(dimmed ? mixHex(base, theme.bg, 0.8) : base), [dimmed, base]);
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const targetScale = hovered || selected ? 1.6 : dimmed ? 0.8 : 1;
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-10 * dt);
    if (mesh.current) {
      const s = mesh.current.scale.x + (targetScale - mesh.current.scale.x) * k;
      mesh.current.scale.setScalar(s);
    }
    if (mat.current) {
      mat.current.color.lerp(targetColor, k);
      mat.current.emissive.copy(mat.current.color).multiplyScalar(selected ? 0.6 : hovered ? 0.35 : 0.08);
    }
  });
  return (
    <mesh ref={mesh} position={w.pos} geometry={sphereGeo} {...handlers}>
      <meshStandardMaterial ref={mat} color={base} roughness={0.4} metalness={0.1} emissive={base} emissiveIntensity={1} />
    </mesh>
  );
}

function Arrow({ from, to, color, head = 0.35 }: { from: Vec3; to: Vec3; color: string; head?: number }) {
  const d = sub(to, from);
  const len = length(d);
  const dir = useMemo(() => new THREE.Vector3(...normalize(d)), [d]);
  const origin = useMemo(() => new THREE.Vector3(...from), [from]);
  return <arrowHelper args={[dir, origin, Math.max(len, 0.01), new THREE.Color(color), head, head * 0.6]} />;
}

function Contents({ store }: { store: SceneStore }) {
  const selectedId = store((s) => s.selectedId);
  const hoveredId = store((s) => s.hoveredId);
  const mode = store((s) => s.params.mode as string);
  const a = store((s) => s.params.a as string);
  const b = store((s) => s.params.b as string);
  const c = store((s) => s.params.c as string);
  const highlight = store((s) => s.highlight);

  const neighbors = useMemo(() => (selectedId && mode === 'neighbors' ? nearestWords(EMBEDDING_WORDS, selectedId, 5) : []), [selectedId, mode]);
  const an = useMemo(() => (mode === 'analogy' ? analogy(EMBEDDING_WORDS, a, b, c, 1) : null), [mode, a, b, c]);
  const selected = selectedId ? getWord(selectedId) : null;
  const hovered = hoveredId ? getWord(hoveredId) : null;

  return (
    <>
      <Grid position={[0, -6.5, 0]} args={[40, 40]} cellSize={1} sectionSize={5} cellColor="#1c2537" sectionColor="#2b3648" fadeDistance={45} fadeStrength={1.5} infiniteGrid={false} />
      <group>
        <Line points={[[-7, 0, 0], [7, 0, 0]]} color="#2b3648" lineWidth={1} transparent opacity={0.6} />
        <Line points={[[0, -7, 0], [0, 7, 0]]} color="#2b3648" lineWidth={1} transparent opacity={0.6} />
        <Line points={[[0, 0, -7], [0, 0, 7]]} color="#2b3648" lineWidth={1} transparent opacity={0.6} />
      </group>

      {EMBEDDING_WORDS.map((w) => (
        <WordSphere key={w.id} store={store} id={w.id} />
      ))}

      {CLUSTERS.map((cl) => {
        const dim = highlight.length > 0 && !highlight.includes(`cluster:${cl.id}`);
        return (
          <Label3D key={cl.id} position={add(cl.center, [0, 1.6, 0])} variant="cluster" style={{ color: CLUSTER_COLORS[cl.colorIndex], opacity: dim ? 0.25 : 1 }}>
            {cl.label}
          </Label3D>
        );
      })}

      {selected && mode === 'neighbors' && (
        <>
          <Label3D position={selected.pos} variant="accent" offsetY={0.45}>
            {selected.word}
          </Label3D>
          {neighbors.map((n) => (
            <group key={n.word.id}>
              <Line points={[selected.pos, n.word.pos]} color={theme.accent} lineWidth={1 + 5 * Math.max(0, n.cos - 0.5)} transparent opacity={0.85} />
              <Label3D position={n.word.pos} variant="muted" offsetY={0.4}>
                {n.word.word} · {fmtFixed(n.cos, 2)}
              </Label3D>
            </group>
          ))}
        </>
      )}

      {an && (
        <>
          <Arrow from={getWord(b).pos} to={getWord(a).pos} color={theme.muted} />
          <Arrow from={getWord(c).pos} to={an.target} color={theme.accent} />
          <Line points={[getWord(b).pos, getWord(c).pos]} color={theme.muted2} lineWidth={1} dashed dashSize={0.15} gapSize={0.1} />
          <mesh position={an.target}>
            <sphereGeometry args={[0.22, 20, 16]} />
            <meshStandardMaterial color={theme.accent} wireframe transparent opacity={0.9} />
          </mesh>
          {an.neighbors[0] && (
            <Line points={[an.target, an.neighbors[0].word.pos]} color={theme.warn} lineWidth={2} dashed dashSize={0.12} gapSize={0.08} />
          )}
          <Label3D position={getWord(a).pos} offsetY={0.42}>{getWord(a).word}</Label3D>
          <Label3D position={getWord(b).pos} offsetY={0.42}>{getWord(b).word}</Label3D>
          <Label3D position={getWord(c).pos} offsetY={0.42}>{getWord(c).word}</Label3D>
          <Label3D position={an.target} variant="accent" offsetY={-0.5}>
            {an.neighbors[0] ? `≈ ${an.neighbors[0].word.word} (cos ${fmtFixed(an.neighbors[0].cos, 2)})` : '?'}
          </Label3D>
        </>
      )}

      {hovered && hovered.id !== selectedId && !neighbors.some((n) => n.word.id === hovered.id) && (
        <Label3D position={hovered.pos} offsetY={0.45}>
          {hovered.word} <span className="muted">· {getCluster(hovered.cluster as ClusterId).label.toLowerCase()}</span>
        </Label3D>
      )}
    </>
  );
}

export default function EmbeddingSpaceScene({ store, active }: SceneProps) {
  return (
    <SceneCanvas store={store} active={active} camera={INITIAL} minDistance={2.5} maxDistance={45}>
      <Contents store={store} />
    </SceneCanvas>
  );
}
