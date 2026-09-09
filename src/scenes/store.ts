import { create, type StoreApi, type UseBoundStore } from 'zustand';
import type { Vec3 } from '@/lib/vec3';

export type ParamValue = number | string | boolean | null;
export type Params = Record<string, ParamValue>;

export interface CameraPose {
  position: Vec3;
  target: Vec3;
}

export interface TourStep {
  id: string;
  title: string;
  text: string;
  camera?: CameraPose;
  highlight?: string[];
  params?: Params;
  select?: string | null;
}

export interface SceneState {
  hoveredId: string | null;
  selectedId: string | null;
  tour: TourStep[];
  tourStep: number | null;
  highlight: string[];
  cameraActive: boolean;
  params: Params;
  /** запрошенная поза камеры (обрабатывает CameraRig) */
  cameraRequest: { pose: CameraPose; nonce: number } | null;
  resetNonce: number;
  initialParams: Params;

  setHovered: (id: string | null) => void;
  select: (id: string | null) => void;
  setParam: (key: string, value: ParamValue) => void;
  setParams: (p: Params) => void;
  setHighlight: (ids: string[]) => void;
  setCameraActive: (v: boolean) => void;
  requestCamera: (pose: CameraPose) => void;
  resetCamera: () => void;
  startTour: () => void;
  goToStep: (i: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
  reset: () => void;
}

export type SceneStore = UseBoundStore<StoreApi<SceneState>>;

export function createSceneStore(initialParams: Params, tour: TourStep[]): SceneStore {
  return create<SceneState>()((set, get) => ({
    hoveredId: null,
    selectedId: null,
    tour,
    tourStep: null,
    highlight: [],
    cameraActive: false,
    params: { ...initialParams },
    cameraRequest: null,
    resetNonce: 0,
    initialParams,

    setHovered: (id) => set({ hoveredId: id }),
    select: (id) => set({ selectedId: id }),
    setParam: (key, value) => set((s) => ({ params: { ...s.params, [key]: value } })),
    setParams: (p) => set((s) => ({ params: { ...s.params, ...p } })),
    setHighlight: (ids) => set({ highlight: ids }),
    setCameraActive: (v) => set({ cameraActive: v }),
    requestCamera: (pose) => set((s) => ({ cameraRequest: { pose, nonce: (s.cameraRequest?.nonce ?? 0) + 1 } })),
    resetCamera: () => set((s) => ({ resetNonce: s.resetNonce + 1 })),

    startTour: () => {
      if (get().tour.length === 0) return;
      get().goToStep(0);
    },
    goToStep: (i) => {
      const { tour } = get();
      const step = tour[i];
      if (!step) return;
      set((s) => ({
        tourStep: i,
        highlight: step.highlight ?? [],
        params: step.params ? { ...s.params, ...step.params } : s.params,
        selectedId: step.select !== undefined ? step.select : s.selectedId,
        cameraRequest: step.camera ? { pose: step.camera, nonce: (s.cameraRequest?.nonce ?? 0) + 1 } : s.cameraRequest,
      }));
    },
    nextStep: () => {
      const { tourStep, tour } = get();
      if (tourStep === null) return;
      if (tourStep >= tour.length - 1) get().endTour();
      else get().goToStep(tourStep + 1);
    },
    prevStep: () => {
      const { tourStep } = get();
      if (tourStep === null || tourStep === 0) return;
      get().goToStep(tourStep - 1);
    },
    endTour: () => set({ tourStep: null, highlight: [] }),
    reset: () =>
      set((s) => ({
        hoveredId: null,
        selectedId: null,
        tourStep: null,
        highlight: [],
        cameraActive: false,
        params: { ...s.initialParams },
        cameraRequest: null,
        resetNonce: s.resetNonce + 1,
      })),
  }));
}
