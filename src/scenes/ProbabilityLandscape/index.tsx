import { Grid } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { SceneCanvas } from '@/components/three/SceneCanvas';
import { Label3D } from '@/components/three/Label3D';
import { Bar3D } from '@/components/three/Bar3D';
import { NGRAM_MODEL } from '@/data/model';
import { nextDistribution, tokenizeText, displayToken } from '@/lib/ngram';
import { transformDistribution } from '@/lib/sampling';
import { fmtPct } from '@/lib/format';
import type { Vec3 } from '@/lib/vec3';
import { theme } from '@/styles/theme';
import type { SceneProps } from '../registry';
import type { SceneStore } from '../store';
import { SHOWN_BARS } from './store';

const INITIAL = { position: [1, 7, 15.5] as Vec3, target: [0, 2.9, 0] as Vec3 };
const N = SHOWN_BARS;
const STEP = 0.62;
const H = 7;
const xOf = (i: number) => (i - (N - 1) / 2) * STEP;

/** Шарик, падающий на выбранный столбик. Точка приземления запоминается в момент броска (nonce), чтобы шарик не уезжал, когда распределение перестроится. */
function DropBall({ x, height, nonce }: { x: number; height: number; nonce: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const t = useRef(1);
  const landing = useRef({ x, height });
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (nonce === 0) return;
    t.current = 0;
    landing.current = { x, height };
    setVisible(true);
    const id = window.setTimeout(() => setVisible(false), 1400);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);
  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m || !visible) return;
    t.current = Math.min(1, t.current + dt / 0.6);
    const e = t.current * t.current;
    m.position.set(landing.current.x, 8 - (8 - landing.current.height - 0.25) * e, 0);
    m.scale.setScalar(1 + (t.current >= 1 ? 0.3 * Math.sin((t.current - 1) * 30) : 0));
  });
  if (!visible) return null;
  return (
    <mesh ref={mesh} position={[x, 8, 0]}>
      <sphereGeometry args={[0.22, 20, 16]} />
      <meshStandardMaterial color={theme.text} emissive={theme.warn} emissiveIntensity={1} />
    </mesh>
  );
}

function Contents({ store }: { store: SceneStore }) {
  const prefix = store((s) => s.params.prefix as string);
  const generated = store((s) => s.params.generated as string);
  const temperature = store((s) => s.params.temperature as number);
  const topK = store((s) => s.params.topK as number);
  const topP = store((s) => s.params.topP as number);
  const pending = store((s) => s.params.pending as string);
  const pendingIdx = store((s) => s.params.pendingIdx as number);
  const dropNonce = store((s) => s.params.dropNonce as number);
  const hoveredId = store((s) => s.hoveredId);

  const tokens = useMemo(() => tokenizeText(`${prefix} ${generated}`), [prefix, generated]);
  const rows = useMemo(() => {
    const dist = nextDistribution(NGRAM_MODEL, tokens);
    return transformDistribution(dist, { temperature, topK: topK > 0 ? topK : null, topP: topP < 1 ? topP : null }).slice(0, N);
  }, [tokens, temperature, topK, topP]);
  const original = useMemo(() => {
    const byToken = new Map(nextDistribution(NGRAM_MODEL, tokens).map((c) => [c.token, c.p]));
    return rows.map((r) => byToken.get(r.token) ?? 0);
  }, [rows, tokens]);
  const lastKept = rows.reduce((acc, r, i) => (r.kept ? i : acc), -1);
  const cutActive = lastKept < rows.length - 1;
  const hoveredIdx = hoveredId?.startsWith('bar:') ? Number(hoveredId.slice(4)) : null;
  // Высота столбика — итоговая вероятность: у оставленных после перенормировки, у отсечённых — после температуры.
  const shownP = (r: (typeof rows)[number]) => (r.kept ? r.pFinal : r.pTemp);
  const maxP = Math.max(...rows.map(shownP), 0.05);
  const scale = H / Math.max(maxP, 0.35);
  const dropX = pendingIdx >= 0 && pendingIdx < rows.length ? xOf(pendingIdx) : xOf(N) + 0.4;
  const dropH = pendingIdx >= 0 && pendingIdx < rows.length ? shownP(rows[pendingIdx]) * scale : 0.05;
  return (
    <>
      <Grid position={[0, -0.02, 0]} args={[40, 30]} cellSize={STEP} sectionSize={STEP * 5} cellColor="#1c2537" sectionColor="#2b3648" fadeDistance={40} fadeStrength={1.5} />
      {rows.map((r, i) => {
        const x = xOf(i);
        const h = shownP(r) * scale;
        const id = `bar:${i}`;
        const hover = hoveredIdx === i;
        return (
          <group key={r.token}>
            <Bar3D
              x={x}
              z={0}
              width={0.44}
              depth={0.44}
              height={h}
              color={r.kept ? (i === 0 ? theme.warn : theme.accent) : theme.border2}
              emissive={hover ? 0.7 : r.kept ? 0.2 : 0}
              opacity={r.kept ? 1 : 0.6}
              onPointerOver={(e) => {
                e.stopPropagation();
                store.getState().setHovered(id);
              }}
              onPointerOut={() => {
                if (store.getState().hoveredId === id) store.getState().setHovered(null);
              }}
            />
            {temperature !== 1 && (
              <mesh position={[x, (original[i] * scale) / 2, 0]}>
                <boxGeometry args={[0.46, Math.max(original[i] * scale, 0.02), 0.46]} />
                <meshBasicMaterial color={theme.muted} wireframe transparent opacity={0.35} />
              </mesh>
            )}
            {(i < 6 || hover) && (
              <Label3D position={[x, h + 0.12, 0]} variant={hover ? 'accent' : r.kept ? 'default' : 'muted'} offsetY={0.25}>
                {displayToken(r.token)} {fmtPct(r.kept ? r.pFinal : r.pTemp, 0)}
                {!r.kept && ' ✕'}
              </Label3D>
            )}
          </group>
        );
      })}
      {cutActive && (
        <>
          <mesh position={[xOf(lastKept) + STEP / 2, H / 2, 0]}>
            <boxGeometry args={[0.03, H, 1.3]} />
            <meshStandardMaterial color={theme.danger} transparent opacity={0.45} emissive={theme.danger} emissiveIntensity={0.6} depthWrite={false} />
          </mesh>
          <Label3D position={[xOf(lastKept) + STEP / 2, H + 0.2, 0]} variant="accent" style={{ borderColor: theme.danger, color: theme.danger }}>
            отсечка: {topK > 0 ? `top-k = ${topK}` : ''}
            {topK > 0 && topP < 1 ? ', ' : ''}
            {topP < 1 ? `top-p = ${fmtPct(topP, 0)}` : ''}
          </Label3D>
        </>
      )}
      <Label3D position={[xOf(0) - 0.6, 0.35, 1.2]} variant="muted">
        {tokens.length ? `«${tokens.slice(-3).join(' ')}» →` : 'пустой контекст →'}
      </Label3D>
      <DropBall x={dropX} height={dropH} nonce={dropNonce} />
      {pending && pendingIdx < 0 && (
        <Label3D position={[xOf(N) + 0.4, 1.2, 0]} variant="accent">
          «{displayToken(pending)}» — из хвоста за пределами {N} показанных
        </Label3D>
      )}
    </>
  );
}

export default function ProbabilityLandscapeScene({ store, active }: SceneProps) {
  return (
    <SceneCanvas store={store} active={active} camera={INITIAL} minDistance={3} maxDistance={40}>
      <Contents store={store} />
    </SceneCanvas>
  );
}
