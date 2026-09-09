import { Canvas } from '@react-three/fiber';
import { type ReactNode } from 'react';
import { useIsTouch, useReducedMotion } from '@/hooks/useMediaQuery';
import type { CameraPose, SceneStore } from '@/scenes/store';
import { theme } from '@/styles/theme';
import { CameraRig } from './CameraRig';
import { SceneLights } from './SceneLights';

interface Props {
  store: SceneStore;
  active: boolean;
  camera: CameraPose;
  minDistance?: number;
  maxDistance?: number;
  children: ReactNode;
  fov?: number;
}

export function SceneCanvas({ store, active, camera, minDistance = 2, maxDistance = 40, children, fov = 45 }: Props) {
  const isTouch = useIsTouch();
  const reduced = useReducedMotion();
  return (
    <div className="scene__canvas">
      <Canvas
        dpr={[1, isTouch ? 1.5 : 1.75]}
        frameloop={active ? 'always' : 'never'}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: camera.position, fov, near: 0.1, far: 200 }}
        onCreated={({ gl }) => gl.setClearColor(theme.bg, 1)}
        onPointerMissed={() => store.getState().select(null)}
        style={{ touchAction: isTouch ? 'none' : undefined }}
      >
        <SceneLights />
        <CameraRig store={store} initial={camera} minDistance={minDistance} maxDistance={maxDistance} reducedMotion={reduced} />
        {children}
      </Canvas>
    </div>
  );
}
