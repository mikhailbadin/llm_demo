import { Button, Slider, Toggle } from '@/components/ui';
import { stackTop, transformerStore } from '@/scenes/TransformerStack/store';

/** Отодвигает камеру так, чтобы стек нужной высоты целиком попадал в кадр. */
function fitCamera(layers: number, exploded: number) {
  const top = stackTop(layers, exploded) + 2.2; // запас под столбики логитов и подписи
  transformerStore.getState().requestCamera({ position: [top * 0.72, top * 0.7, top * 1.35], target: [0, top * 0.5, 0] });
}

export function TransformerOverlay() {
  const layers = transformerStore((s) => s.params.layers as number);
  const exploded = transformerStore((s) => s.params.exploded as number);
  const particles = transformerStore((s) => s.params.particles as boolean);
  const st = transformerStore.getState();
  return (
    <>
      <Slider
        label="Число блоков L"
        value={layers}
        min={2}
        max={12}
        onChange={(v) => {
          const nextExploded = exploded >= v ? -1 : exploded;
          st.setParams({ layers: v, exploded: nextExploded });
          fitCamera(v, nextExploded);
        }}
      />
      <div className="small muted">GPT-2 small: 12 · LLaMA-7B: 32 · GPT-3: 96</div>
      <Toggle label="Частицы" checked={particles} onChange={(v) => st.setParam('particles', v)} />
      {exploded >= 0 ? (
        <Button
          size="sm"
          onClick={() => {
            st.setParam('exploded', -1);
            fitCamera(layers, -1);
          }}
        >
          Собрать блок {exploded + 1}
        </Button>
      ) : (
        <div className="small muted">Нажмите на блок, чтобы раскрыть его устройство. Наводите на плиты — появятся подписи.</div>
      )}
    </>
  );
}
