import { useMemo, useState } from 'react';
import { BarChart } from '@/components/charts';
import { Button, CoachMark, WidgetFrame } from '@/components/ui';
import { NGRAM_MODEL } from '@/data/model';
import { createRng } from '@/lib/rng';
import { displayToken, endSentence, nextDistribution, tokenizeText, EOS } from '@/lib/ngram';
import { sampleIndex } from '@/lib/sampling';
import { fmtPct } from '@/lib/format';
import { theme } from '@/styles/theme';

const DEFAULT = 'кот сидит на';

export function NextWordPredictor() {
  const [text, setText] = useState(DEFAULT);
  const [touched, setTouched] = useState(false);
  const [seed, setSeed] = useState(1);
  const tokens = useMemo(() => tokenizeText(text), [text]);
  const dist = useMemo(() => nextDistribution(NGRAM_MODEL, tokens), [tokens]);
  const top = dist.slice(0, 8);
  const rest = 1 - top.reduce((s, c) => s + c.p, 0);

  // Самый вероятный вариант может оказаться концом фразы: тогда «добавить слово» нечего,
  // и кнопка должна об этом честно говорить, а не дописывать вторую точку.
  const isEnd = top[0].token === EOS;
  const finished = /[.!?…]$/.test(text.trimEnd());

  // Токен приклеивается к исходному тексту, а не к пересобранному из токенов: так сохраняются регистр и знаки,
  // которые модель не видит.
  const append = (tok: string) => {
    setTouched(true);
    if (tok === EOS) {
      setText((t) => endSentence(t));
      return;
    }
    setText((t) => {
      const base = t.trimEnd();
      if (!base) return tok;
      return /^[.,!?;:]$/.test(tok) ? base + tok : `${base} ${tok}`;
    });
  };

  return (
    <WidgetFrame
      title="Предскажи следующее слово"
      icon="🔮"
      help={
        <>
          Введите начало фразы. Справа — восемь самых вероятных продолжений по мнению игрушечной модели, обученной на {NGRAM_MODEL.sentences} предложениях про кота,
          собаку и погоду. Кнопка «Добавить самое вероятное» дописывает слово и повторяет предсказание — это и есть цикл генерации. «Добавить случайное» выбирает
          слово случайно с учётом вероятностей; можно также нажать на любой столбик.
        </>
      }
      onReset={() => {
        setText(DEFAULT);
        setTouched(false);
        setSeed(1);
      }}

      note="Модель ничего не «понимает»: она считает, какие слова встречались после таких же слов в обучающих текстах. У настоящих LLM тот же принцип, только словарь — сотни тысяч токенов, а контекст — тысячи слов."
    >
      <div className="grid-2">
        <div>
          <div className="field">
            <label className="field__label" htmlFor="nwp-input">
              <span>Начало фразы</span>
              <CoachMark show={!touched}>Попробуйте «собака» или «дети играют»</CoachMark>
            </label>
            <textarea
              id="nwp-input"
              className="textarea"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setTouched(true);
              }}
              rows={3}
              spellCheck={false}
            />
          </div>
          <div className="btn-row" style={{ marginTop: 10 }}>
            <Button variant="primary" onClick={() => append(top[0].token)} disabled={isEnd && finished}>
              {isEnd ? 'Завершить фразу' : 'Добавить самое вероятное'}
            </Button>
            <Button
              disabled={isEnd && finished}
              onClick={() => {
                const rng = createRng(seed);
                setSeed((s) => s + 1);
                append(dist[sampleIndex(dist.map((c) => c.p), rng)].token);
              }}
            >

              Добавить случайное
            </Button>
          </div>
          <p className="small muted" style={{ marginTop: 10 }}>
            Модель видит {tokens.length === 0 ? 'пустой контекст' : `последние слова: «${tokens.slice(-2).join(' ')}»`}. Всего в словаре {NGRAM_MODEL.vocab.length} токенов.
          </p>
          {isEnd && (
            <p className="small" style={{ marginTop: 6, color: theme.warn }}>
              Самый вероятный токен — «⏎»: модель считает, что предложение закончено. Допишите слово сами или нажмите на любой другой столбик.
            </p>
          )}
        </div>
        <div>
          <div className="small muted" style={{ marginBottom: 6 }}>
            Вероятность следующего токена
          </div>
          <BarChart
            items={top.map((c, i) => ({ label: displayToken(c.token), value: c.p, highlight: i === 0, title: `${displayToken(c.token)}: ${fmtPct(c.p)}` }))}
            onClick={(i) => append(top[i].token)}
            format={(v) => fmtPct(v)}
            ariaLabel="Топ-8 следующих токенов"
          />
          <div className="small muted" style={{ marginTop: 4 }}>
            Остальные {NGRAM_MODEL.vocab.length - 8} токенов вместе: {fmtPct(rest)}. Нажмите на столбик, чтобы добавить слово.
          </div>
        </div>
      </div>
    </WidgetFrame>
  );
}
