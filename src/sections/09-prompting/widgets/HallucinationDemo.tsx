import { useState } from 'react';
import { Button, WidgetFrame } from '@/components/ui';
import { NGRAM_MODEL } from '@/data/model';
import { detokenize, generate, tokenizeText } from '@/lib/ngram';
import { createRng } from '@/lib/rng';

// Начала фраз, которых в корпусе нет: модель вынуждена «сочинять», и продолжения меняются от варианта к варианту.
const PROMPTS = ['в городе живёт', 'машина сидит на', 'папа лает на', 'дети едут'];

export function HallucinationDemo() {
  const [seed, setSeed] = useState(1);
  const [i, setI] = useState(0);
  const reset = () => {
    setSeed(1);
    setI(0);
  };
  const prefix = PROMPTS[i];
  const text = generate(NGRAM_MODEL, tokenizeText(prefix), 14, createRng(seed), { temperature: 1.1, topK: null, topP: null });
  return (
    <WidgetFrame
      title="Уверенно и неправда"
      icon="🎭"
      help="Начала фраз подобраны так, что в обучающем корпусе их не было. Модель всё равно продолжает — по вероятностям, как всегда. Получается связно, но бессмысленно: она не проверяет факты, потому что у неё нет фактов, есть только статистика. «Ещё вариант» меняет seed."
      onReset={reset}
      note="У больших моделей то же самое, только статистика гораздо богаче, поэтому ошибки реже и убедительнее. Галлюцинация — не сбой, а нормальный режим работы предсказателя текста, когда у него нет нужной информации в контексте. Лекарство — дать информацию в контекст (RAG) или попросить модель признать незнание."
    >
      <div className="btn-row" style={{ marginBottom: 10 }}>
        {PROMPTS.map((p, k) => (
          <Button key={p} size="sm" variant={k === i ? 'primary' : 'default'} onClick={() => setI(k)}>
            {p}…
          </Button>
        ))}
        <Button size="sm" onClick={() => setSeed((s) => s + 1)}>
          🎲 Ещё вариант
        </Button>
      </div>
      <div className="card" style={{ padding: '12px 14px', fontSize: 16 }}>
        <span className="muted">{prefix}</span> {detokenize(text)}
      </div>
    </WidgetFrame>
  );
}
