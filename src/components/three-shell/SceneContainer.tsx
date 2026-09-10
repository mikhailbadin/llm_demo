import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useInView } from '@/hooks/useInView';
import { useWebGLSupport } from '@/hooks/useWebGLSupport';
import { useIsTouch } from '@/hooks/useMediaQuery';
import { useScrollLock } from '@/hooks/useScrollLock';
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

/** Метка в истории: пока она в location.state, кнопка «назад» сворачивает сцену, а не уводит из раздела. */
interface ExpandState {
  sceneExpanded?: SceneId;
}

/**
 * Оболочка 3D-сцены без импортов three: заголовок, тулбар, ленивая загрузка, экскурсия,
 * развёрнутый на весь экран режим, защита от перехвата скролла и запасной вариант без WebGL.
 */
export function SceneContainer({ id, sceneId, title, store, overlay, legend, help }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const expandBtnRef = useRef<HTMLButtonElement>(null);
  const near = useInView(ref, { rootMargin: '300px', sticky: true });
  const visible = useInView(ref, { rootMargin: '80px' });
  const webgl = useWebGLSupport();
  const isTouch = useIsTouch();
  const navigate = useNavigate();
  const location = useLocation();
  const [guardDismissed, setGuardDismissed] = useState(false);
  // Режим и его данные в одном состоянии: пока секция в fixed, обёртка держит её прежнюю высоту.
  const [slotHeight, setSlotHeight] = useState<number | null>(null);
  const expanded = slotHeight !== null;
  // На узких экранах панель управления по умолчанию свёрнута, чтобы не закрывать сцену;
  // в развёрнутом кадре места хватает, поэтому у режима своя память о ней.
  const [overlayOpen, setOverlayOpen] = useState(() => !(typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches));
  const [overlayOpenExpanded, setOverlayOpenExpanded] = useState(true);
  const panelOpen = expanded ? overlayOpenExpanded : overlayOpen;
  const setPanelOpen = expanded ? setOverlayOpenExpanded : setOverlayOpen;

  const tourStep = store((s) => s.tourStep);
  const cameraActive = store((s) => s.cameraActive);
  const tourLength = store((s) => s.tour.length);

  const Scene = SCENE_COMPONENTS[sceneId];
  // Ререндер оболочки (экскурсия, камера, режим) не должен тащить за собой всё дерево сцены.
  const sceneEl = useMemo(() => <Scene store={store} active={visible} />, [Scene, store, visible]);
  const here = location.pathname + location.search + location.hash;
  const marked = (location.state as ExpandState | null)?.sceneExpanded === sceneId;

  useScrollLock(expanded);

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

  const collapse = () => {
    setSlotHeight(null);
    expandBtnRef.current?.focus({ preventScroll: true });
    // Метку из истории снимает «назад»: так кнопка и Esc не плодят лишних записей.
    if (marked) navigate(-1);
  };

  const expand = () => {
    setSlotHeight(slotRef.current?.getBoundingClientRect().height ?? null);
    store.getState().setCameraActive(true);
    navigate(here, { state: { ...((location.state ?? {}) as ExpandState), sceneExpanded: sceneId } });
    ref.current?.focus({ preventScroll: true });
  };

  // Сверяем режим с меткой в истории: «назад» убрал метку — сворачиваемся;
  // метка пережила перезагрузку страницы — снимаем её, чтобы раздел не открылся развёрнутым.
  useEffect(() => {
    if (marked === expanded) return;
    if (marked) {
      const rest = { ...((location.state ?? {}) as ExpandState) };
      delete rest.sceneExpanded;
      navigate(here, { replace: true, state: rest });
    } else collapse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marked]);

  // Единственный владелец Escape: в развёрнутом виде клавиша прилетает и мимо сцены, поэтому слушаем документ.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (!expanded && !ref.current?.contains(document.activeElement)) return;
      const s = store.getState();
      if (s.tourStep !== null) s.endTour();
      else if (expanded) collapse();
      else s.setCameraActive(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, marked, store]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const s = store.getState();
    if (s.tourStep === null) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      s.nextStep();
    } else if (e.key === 'ArrowLeft') {
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
    <div className="scene-slot" ref={slotRef} style={slotHeight !== null ? { height: slotHeight } : undefined}>
      <section className={`scene${expanded ? ' scene--expanded' : ''}`} id={id} aria-label={title}>
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
          {webgl && (
            <Button
              ref={expandBtnRef}
              size="sm"
              variant="ghost"
              onClick={() => (expanded ? collapse() : expand())}
              title={expanded ? 'Свернуть сцену (Esc)' : 'Развернуть сцену на весь экран'}
              aria-expanded={expanded}
            >
              {expanded ? '✕ Свернуть' : '⛶ Развернуть'}
            </Button>
          )}
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
          {!webgl ? <SceneFallback /> : near ? <Suspense fallback={<SceneFallback loading />}>{sceneEl}</Suspense> : <SceneFallback loading />}
          {overlay && panelOpen && (
            <div className="scene__overlay">
              <div className="row row--between">
                <h4>Управление</h4>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPanelOpen(false)} aria-label="Свернуть панель">
                  ✕
                </button>
              </div>
              {overlay}
            </div>
          )}
          {overlay && !panelOpen && (
            <Button size="sm" className="scene__overlay-toggle" onClick={() => setPanelOpen(true)}>
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
    </div>
  );
}
