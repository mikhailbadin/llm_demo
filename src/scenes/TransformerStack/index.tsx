import { Edges, Grid } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SceneCanvas } from '@/components/three/SceneCanvas';
import { Label3D } from '@/components/three/Label3D';
import { Bar3D } from '@/components/three/Bar3D';
import { useHoverable } from '@/components/three/useHoverable';
import { NGRAM_MODEL } from '@/data/model';
import { nextDistribution, displayToken } from '@/lib/ngram';
import { fmtPct } from '@/lib/format';
import { createRng } from '@/lib/rng';
import type { Vec3 } from '@/lib/vec3';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { mixHex, theme } from '@/styles/theme';
import type { SceneProps } from '../registry';
import type { SceneStore } from '../store';
import { BASE_Y, BLOCK_GAP, BLOCK_H, EXPLODED_H, stackTop } from './store';

// Совпадает с fitCamera() в панели: в кадр помещается и стек из 6 блоков, и столбики логитов над ним.
const INITIAL = { position: [7.1, 6.9, 13.2] as Vec3, target: [0, 4.9, 0] as Vec3 };
const TOKENS = ['утром', 'на', 'улице', 'идёт'];
const W = 4.4;
const D = 1.4;

function useDim(store: SceneStore, id: string) {
  const highlight = store((s) => s.highlight);
  return highlight.length > 0 && !highlight.includes(id);
}

function Slab({ store, index, y, height, exploded, onToggle }: { store: SceneStore; index: number; y: number; height: number; exploded: boolean; onToggle: () => void }) {
  const id = `block:${index}`;
  const hovered = store((s) => s.hoveredId === id);
  const dim = useDim(store, id);
  const layers = store((s) => s.params.layers as number);
  const handlers = useHoverable(store, id, false);
  const color = dim ? mixHex(theme.blue, theme.bg, 0.7) : hovered ? '#7cb4ff' : theme.blue;
  const inner = (label: string, yy: number, c: string, hid: string, h = 0.2) => <InnerPlate key={hid} store={store} id={hid} y={yy} color={c} label={label} height={h} dim={dim} />;
  return (
    <group position={[0, y, 0]}>
      <mesh
        position={[0, height / 2, 0]}
        {...handlers}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <boxGeometry args={[W, height, D]} />
        <meshStandardMaterial color={color} transparent opacity={hovered ? 0.3 : 0.18} depthWrite={false} roughness={0.3} />
        <Edges color={dim ? theme.border2 : hovered ? theme.text : '#4f7bd9'} />
      </mesh>
      {exploded ? (
        <>
          {inner('LayerNorm', 0.2, theme.muted, `ln1:${index}`, 0.08)}
          {inner('Внимание: токены обмениваются информацией', 0.55, theme.orange, `attn:${index}`, 0.22)}
          {inner('+ сложить с остаточным потоком', 0.95, theme.ok, `add1:${index}`, 0.08)}
          {inner('LayerNorm', 1.3, theme.muted, `ln2:${index}`, 0.08)}
          {inner('MLP: каждый токен обрабатывается отдельно', 1.65, theme.accent2, `mlp:${index}`, 0.22)}
          {inner('+ сложить с остаточным потоком', 2.05, theme.ok, `add2:${index}`, 0.08)}
        </>
      ) : (
        <>
          {inner('Внимание', 0.2, theme.orange, `attn:${index}`)}
          {inner('MLP', 0.48, theme.accent2, `mlp:${index}`)}
        </>
      )}
      {(hovered || exploded) && (
        <Label3D position={[W / 2 + 0.2, height / 2, 0]} variant={exploded ? 'accent' : 'default'}>
          Блок {index + 1} из {layers}
          {exploded ? ' — нажмите, чтобы собрать' : ': внимание + MLP (нажмите)'}
        </Label3D>
      )}
    </group>
  );
}

function InnerPlate({ store, id, y, color, label, height, dim }: { store: SceneStore; id: string; y: number; color: string; label: string; height: number; dim: boolean }) {
  const handlers = useHoverable(store, id, false);
  const hovered = store((s) => s.hoveredId === id);
  return (
    <>
      <mesh position={[0, y, 0]} {...handlers}>
        <boxGeometry args={[W - 0.6, height, D - 0.4]} />
        <meshStandardMaterial color={dim ? mixHex(color, theme.bg, 0.7) : color} transparent opacity={0.75} emissive={color} emissiveIntensity={hovered ? 0.5 : 0.12} roughness={0.4} />
      </mesh>
      {hovered && (
        <Label3D position={[-(W / 2) - 0.2, y, 0]} variant="accent">
          {label}
        </Label3D>
      )}
    </>
  );
}

function Particles({ height, enabled }: { height: number; enabled: boolean }) {
  const count = 240;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const rng = createRng(5);
    return Array.from({ length: count }, () => ({ phase: rng.next(), x: (rng.next() - 0.5) * (W - 0.8), z: (rng.next() - 0.5) * (D - 0.5), speed: 0.5 + rng.next() * 0.6 }));
  }, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const c1 = useMemo(() => new THREE.Color(theme.accent), []);
  const c2 = useMemo(() => new THREE.Color(theme.warn), []);
  const tmp = useMemo(() => new THREE.Color(), []);
  const t = useRef(0);
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    data.forEach((_, i) => m.setColorAt(i, c1));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [data, c1]);
  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    if (enabled) t.current += dt;
    data.forEach((p, i) => {
      const u = ((t.current * p.speed * 0.35 + p.phase) % 1 + 1) % 1;
      const y = 0.65 + u * (height - 0.6);
      const swirl = Math.sin(u * 40 + p.phase * 6) * 0.12;
      dummy.position.set(p.x + swirl, y, p.z + Math.cos(u * 40 + p.phase * 6) * 0.08);
      dummy.scale.setScalar(0.035);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      tmp.copy(c1).lerp(c2, u);
      m.setColorAt(i, tmp);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

function Contents({ store }: { store: SceneStore }) {
  const layers = store((s) => s.params.layers as number);
  const exploded = store((s) => s.params.exploded as number);
  const particlesOn = store((s) => s.params.particles as boolean);
  const reduced = useReducedMotion();
  const top = stackTop(layers, exploded);
  const dimTokens = useDim(store, 'tokens');
  const dimEmbed = useDim(store, 'embed');
  const dimRes = useDim(store, 'residual');
  const dimTop = useDim(store, 'top');
  const dist = useMemo(() => nextDistribution(NGRAM_MODEL, TOKENS).slice(0, 5), []);
  const residualHandlers = useHoverable(store, 'residual', false);
  const resHover = store((s) => s.hoveredId === 'residual');
  const embedHandlers = useHoverable(store, 'embed', false);
  const embedHover = store((s) => s.hoveredId === 'embed');
  const topHandlers = useHoverable(store, 'top', false);
  const topHover = store((s) => s.hoveredId === 'top');

  let y = BASE_Y;
  const slabs = [];
  for (let l = 0; l < layers; l++) {
    const h = l === exploded ? EXPLODED_H : BLOCK_H;
    slabs.push(<Slab key={l} store={store} index={l} y={y} height={h} exploded={l === exploded} onToggle={() => store.getState().setParam('exploded', exploded === l ? -1 : l)} />);
    y += h + BLOCK_GAP;
  }

  return (
    <>
      <Grid position={[0, -0.3, 0]} args={[30, 30]} cellSize={0.5} sectionSize={2.5} cellColor="#1c2537" sectionColor="#2b3648" fadeDistance={35} fadeStrength={1.5} />
      {TOKENS.map((t, i) => (
        <group key={t} position={[(i - (TOKENS.length - 1) / 2) * 0.95, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color={dimTokens ? mixHex(theme.accent, theme.bg, 0.7) : theme.accent} emissive={theme.accent} emissiveIntensity={0.15} />
          </mesh>
          {/* Соседние подписи разводим по высоте: при большом N камера далеко и они наезжают друг на друга. */}
          <Label3D position={[0, i % 2 === 0 ? -0.55 : -1, 0]} variant={dimTokens ? 'muted' : 'default'}>
            {t}
          </Label3D>
        </group>
      ))}
      <mesh position={[0, 0.65, 0]} {...embedHandlers}>
        <boxGeometry args={[W, 0.12, D]} />
        <meshStandardMaterial color={dimEmbed ? mixHex(theme.accent, theme.bg, 0.7) : theme.accent} emissive={theme.accent} emissiveIntensity={embedHover ? 0.5 : 0.2} />
      </mesh>
      <Label3D position={[-(W / 2) - 0.2, 0.65, 0]} variant={dimEmbed ? 'muted' : 'default'}>
        {embedHover ? 'Эмбеддинги: номер токена → вектор' : 'Эмбеддинги'}
      </Label3D>

      <mesh position={[0, (0.7 + top) / 2, 0]} {...residualHandlers}>
        <cylinderGeometry args={[0.07, 0.07, top - 0.7, 12]} />
        <meshStandardMaterial color={theme.accent2} emissive={theme.accent2} emissiveIntensity={dimRes ? 0.1 : resHover ? 1.2 : 0.7} transparent opacity={dimRes ? 0.3 : 0.95} />
      </mesh>
      {(resHover || !dimRes) && store.getState().highlight.includes('residual') && (
        <Label3D position={[0.3, top / 2, 0]} variant="accent">
          Остаточный поток: вектор токена, к которому каждый блок прибавляет свою поправку
        </Label3D>
      )}
      {resHover && !store.getState().highlight.includes('residual') && (
        <Label3D position={[0.3, top / 2, 0]} variant="accent">
          Остаточный поток
        </Label3D>
      )}
      <Particles height={top} enabled={particlesOn && !reduced} />

      {slabs}

      <mesh position={[0, top, 0]} {...topHandlers}>
        <boxGeometry args={[W, 0.12, D]} />
        <meshStandardMaterial color={dimTop ? mixHex(theme.warn, theme.bg, 0.7) : theme.warn} emissive={theme.warn} emissiveIntensity={topHover ? 0.5 : 0.2} />
      </mesh>
      <Label3D position={[-(W / 2) - 0.2, top, 0]} variant={dimTop ? 'muted' : 'default'}>
        {topHover ? 'Выходной слой: вектор → логиты по всему словарю → softmax' : 'Логиты → softmax'}
      </Label3D>
      {dist.map((c, i) => (
        <group key={c.token} position={[0, top + 0.1, 0]}>
          <Bar3D x={(i - 2) * 0.8} z={0} width={0.5} depth={0.5} height={Math.max(0.05, c.p * 4)} color={dimTop ? mixHex(theme.warn, theme.bg, 0.7) : i === 0 ? theme.warn : theme.orange} emissive={0.2} />
        </group>
      ))}
      {/* Подписи столбиков собраны в один список слева: при N = 12 камера далеко, и пять
          отдельных подписей над столбиками налезали друг на друга. Справа держать нельзя —
          там панель управления. */}
      <Label3D position={[-(W / 2) - 1.2, top + Math.max(1.8, top * 0.18), 0]} variant={dimTop ? 'muted' : 'default'}>
        <span style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '1px 8px' }}>
          {dist.map((c, i) => (
            <Fragment key={c.token}>
              <span style={{ color: i === 0 ? theme.warn : undefined, fontWeight: i === 0 ? 600 : 400 }}>{displayToken(c.token)}</span>
              <span style={{ textAlign: 'right', color: i === 0 ? theme.warn : theme.muted }}>{fmtPct(c.p, 0)}</span>
            </Fragment>
          ))}
        </span>
      </Label3D>
    </>
  );
}

export default function TransformerStackScene({ store, active }: SceneProps) {
  return (
    <SceneCanvas store={store} active={active} camera={INITIAL} minDistance={2} maxDistance={40}>
      <Contents store={store} />
    </SceneCanvas>
  );
}
