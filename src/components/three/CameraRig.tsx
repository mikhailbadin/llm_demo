import { CameraControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import CameraControlsImpl from 'camera-controls';
import { useCallback, useEffect, useRef } from 'react';
import type { CameraPose, SceneStore } from '@/scenes/store';
import type { Vec3 } from '@/lib/vec3';

interface Props {
  store: SceneStore;
  initial: CameraPose;
  minDistance: number;
  maxDistance: number;
  reducedMotion: boolean;
}

/** Ракурсы заданы под широкий экран; на узком по горизонтали помещается меньше, поэтому отодвигаем камеру. */
const REFERENCE_ASPECT = 1.55;

/** Камера: плавные перелёты по запросу стора, сброс, и колесо мыши только после клика по сцене. */
export function CameraRig({ store, initial, minDistance, maxDistance, reducedMotion }: Props) {
  const ref = useRef<CameraControlsImpl>(null);
  const cameraActive = store((s) => s.cameraActive);
  const request = store((s) => s.cameraRequest);
  const resetNonce = store((s) => s.resetNonce);
  const size = useThree((s) => s.size);

  const aspectRef = useRef(1);
  aspectRef.current = size.width / Math.max(size.height, 1);

  /** Отодвигает позицию от цели, если кадр уже эталонного. */
  const applyPose = useCallback(
    (pose: CameraPose, animate: boolean) => {
      const c = ref.current;
      if (!c) return;
      const k = Math.min(2.4, Math.max(1, REFERENCE_ASPECT / aspectRef.current));
      const p = pose.position.map((v, i) => pose.target[i] + (v - pose.target[i]) * k) as Vec3;
      void c.setLookAt(...p, ...pose.target, animate);
    },
    [],
  );

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    applyPose(initial, false);
    c.saveState();
  }, [initial, applyPose]);

  useEffect(() => {
    if (!request) return;
    applyPose(request.pose, !reducedMotion);
  }, [request, reducedMotion, applyPose]);

  useEffect(() => {
    if (resetNonce === 0) return;
    applyPose(initial, !reducedMotion);
  }, [resetNonce, initial, reducedMotion, applyPose]);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.mouseButtons.wheel = cameraActive ? CameraControlsImpl.ACTION.DOLLY : CameraControlsImpl.ACTION.NONE;
    c.mouseButtons.left = CameraControlsImpl.ACTION.ROTATE;
    c.mouseButtons.right = CameraControlsImpl.ACTION.TRUCK;
    c.touches.one = CameraControlsImpl.ACTION.TOUCH_ROTATE;
    c.touches.two = CameraControlsImpl.ACTION.TOUCH_DOLLY_TRUCK;
  }, [cameraActive]);

  return <CameraControls ref={ref} makeDefault smoothTime={0.45} minDistance={minDistance} maxDistance={maxDistance} maxPolarAngle={Math.PI * 0.92} />;
}
