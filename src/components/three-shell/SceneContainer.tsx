import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { useInView } from '@/hooks/useInView';
import { useWebGLSupport } from '@/hooks/useWebGLSupport';
import { useIsTouch } from '@/hooks/useMediaQuery';
import { SCENE_COMPONENTS, type SceneId } from '@/scenes/registry';
import type { SceneStore } from '@/scenes/store';
import { Button } from '@/components/ui/Button';
import { HelpButton } from '@/components/ui/IconTooltip';
import { SceneFallback } from './SceneFallback';
import { TourOverlay } from './TourOverlay';

interface Props {
  id?: string;
  sceneId: SceneId;
  title: string;

  store: SceneStore;
  overlay?: ReactNode;
  legend?: ReactNode;
  help?: ReactNode;
}

/**
 * Оболочка 3D-сцены без импортов three: заголовок, тулбар, ленивая загрузка, экскурсия,
 * защита от перехвата скролла и запасной вариант без WebGL.
 */
export function SceneContainer({ id, sceneId, title, store, overlay, legend, help }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { rootMargin: '300px', sticky: true });
  const visible = useInView(ref, { rootMargin: '80px' });
  const webgl = useWebGLSupport();
  const isTouch = useIsTouch();
  const [guardDismissed, setGuardDismissed] = useState(false);
  // На узких экранах панель управления по умолчанию свёрнута, чтобы не закрывать сцену.
  const [overlayOpen, setOverlayOpen] = useState(() => !(typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches));

  const tourStep = store((s) => s.tourStep);
  const cameraActive = store((s) => s.cameraActive);
  const tourLength = store((s) => s.tour.length);

  const Scene = SCENE_COMPONENTS[sceneId];

  useEffect(() => {
    if (!visible) {
      setGuardDismissed(false);
      store.getState().setCameraActive(false);
    }
  }, [visible, store]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) store.getState().setCameraActive(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [store]);

  useEffect(() => () => store.getState().reset(), [store]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const s = store.getState();
    if (e.key === 'Escape') {
      if (s.tourStep !== null) s.endTour();
      else s.setCameraActive(false);
    } else if (s.tourStep !== null && e.key === 'ArrowRight') {
      e.preventDefault();
      s.nextStep();
    } else if (s.tourStep !== null && e.key === 'ArrowLeft') {
      e.preventDefault();
      s.prevStep();
    }
  };

  const showGuard = isTouch && !guardDismissed && webgl;

  // Клавиши ← → Esc обрабатывает viewport, поэтому при старте экскурсии переводим фокус на него.
  const toggleTour = () => {
    const s = store.getState();
    if (s.tourStep === null) {
      s.startTour();
      ref.current?.focus({ preventScroll: true });
    } else s.endTour();
  };

  return (
    <section className="scene" id={id} aria-label={title}>
      <header className="scene__head">
        <span className="scene__title">
          <span className="scene__badge">3D</span>
          {title}
        </span>
        {tourLength > 0 && (
          <Button size="sm" variant={tourStep === null ? 'primary' : 'default'} onClick={toggleTour}>
            {tourStep === null ? '▶ Экскурсия' : '■ Завершить'}
          </Button>
        )}

        <Button size="sm" variant="ghost" onClick={() => store.getState().resetCamera()} title="Вернуть камеру в исходное положение">
          ⟲ Камера
        </Button>
        <HelpButton label="Как управлять сценой">
          <p style={{ margin: '0 0 6px' }}>
            <strong>Мышь:</strong> левая кнопка — вращать, колесо — приближать, правая кнопка — сдвигать.
          </p>
          <p style={{ margin: '0 0 6px' }}>
            <strong>Сенсорный экран:</strong> один палец — вращать, два — масштаб и сдвиг.
          </p>
          <p style={{ margin: 0 }}>Наведите курсор на объекты — появятся подписи. Кнопка «Экскурсия» проведёт по сцене по шагам.</p>
          {help && <div style={{ marginTop: 8 }}>{help}</div>}
        </HelpButton>
      </header>
      <div
        className="scene__viewport"
        ref={ref}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={() => store.getState().setCameraActive(true)}
        aria-label={`3D-сцена: ${title}`}
      >
        {!webgl ? (
          <SceneFallback />
        ) : near ? (
          <Suspense fallback={<SceneFallback loading />}>
            <Scene store={store} active={visible} />
          </Suspense>
        ) : (
          <SceneFallback loading />
        )}
        {overlay && overlayOpen && (
          <div className="scene__overlay">
            <div className="row row--between">
              <h4>Управление</h4>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setOverlayOpen(false)} aria-label="Свернуть панель">
                ✕
              </button>
            </div>
            {overlay}
          </div>
        )}
        {overlay && !overlayOpen && (
          <Button size="sm" className="scene__overlay-toggle" onClick={() => setOverlayOpen(true)}>
            ⚙ Управление
          </Button>
        )}
        {!isTouch && <div className={`scene__hint${cameraActive ? ' is-hidden' : ''}`}>🖱 нажмите на сцену, чтобы вращать и приближать</div>}
        {showGuard && (
          <div className="scene__guard" onClick={() => setGuardDismissed(true)} role="button" tabIndex={0}>
            <span>Нажмите, чтобы управлять сценой</span>
          </div>
        )}
        {webgl && <TourOverlay store={store} />}
      </div>
      {legend && <div className="widget__foot">{legend}</div>}
      {!webgl && tourLength > 0 && (
        <div className="widget__body">
          <ol>
            {store.getState().tour.map((t) => (
              <li key={t.id}>
                <strong>{t.title}.</strong> {t.text}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
