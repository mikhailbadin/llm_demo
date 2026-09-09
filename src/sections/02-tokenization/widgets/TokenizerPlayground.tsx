import { useMemo, useState } from 'react';
import { SegmentedControl, TokenChips, WidgetFrame } from '@/components/ui';
import { BPE_MODEL } from '@/data/model';
import { tokenizeBpe, tokenizeChars, tokenizeWords, splitWords, EOW } from '@/lib/bpe';
import { fmtFixed, plural } from '@/lib/format';

type Mode = 'chars' | 'words' | 'bpe';
const DEFAULT = 'Нейросети учатся предсказывать следующий токен. Это простой процесс, который работает.';

export function TokenizerPlayground() {
  const [text, setText] = useState(DEFAULT);
  const [mode, setMode] = useState<Mode>('bpe');
  const tokens = useMemo(() => {
    if (mode === 'chars') return tokenizeChars(text);
    if (mode === 'words') return tokenizeWords(text);
    return tokenizeBpe(text, BPE_MODEL);
  }, [text, mode]);
  const words = splitWords(text).length || 1;
  const unknown = tokens.filter((t) => t.id < 0).length;

  return (
    <WidgetFrame
      title="Токенизатор: символы, слова или подслова"
      icon="✂️"
      help={
        <>
          Введите любой текст и переключайте режим. Под каждым токеном — его номер в словаре. В режиме BPE словарь построен на маленьком корпусе из 90 слов, поэтому
          незнакомые слова распадаются на кусочки, а символ «▁» отмечает конец слова.
        </>
      }
      onReset={() => {
        setText(DEFAULT);
        setMode('bpe');
      }}
      note={
        mode === 'chars'
          ? 'Символы: словарь крошечный, но последовательности длинные, и модели трудно «увидеть» слово целиком.'
          : mode === 'words'
            ? 'Слова: последовательности короткие, но словарь бесконечен — любая опечатка или редкое слово становятся «неизвестным токеном».'
            : 'Подслова (BPE): компромисс. Частые слова — один токен, редкие — несколько знакомых кусочков. Незнакомых слов не бывает: в худшем случае слово распадётся на отдельные буквы.'
      }
    >
      <div className="controls">
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label className="field__label" htmlFor="tok-input">
            <span>Текст</span>
          </label>
          <textarea id="tok-input" className="textarea" value={text} onChange={(e) => setText(e.target.value)} rows={3} spellCheck={false} />
        </div>
        <SegmentedControl
          ariaLabel="Режим токенизации"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'chars', label: 'Символы' },
            { value: 'words', label: 'Слова' },
            { value: 'bpe', label: 'Подслова (BPE)' },
          ]}
        />
      </div>
      <div className="stat-row">
        <div className="stat">
          <span className="stat__label">Токенов</span>
          <span className="stat__value">{tokens.length}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Символов</span>
          <span className="stat__value">{[...text].length}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Токенов на слово</span>
          <span className="stat__value">{fmtFixed(tokens.length / words, 2)}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Размер словаря</span>
          <span className="stat__value stat__value--sm">{mode === 'chars' ? '≈ 150' : mode === 'words' ? '∞' : BPE_MODEL.vocab.length}</span>
        </div>
      </div>
      <TokenChips
        tokens={tokens.map((t, i) => ({
          text: t.text.replace(EOW, mode === 'bpe' ? '▁' : ''),
          id: t.id < 0 ? '?' : t.id,
          color: i % 6,
          title: t.id < 0 ? 'Этого символа нет в словаре' : `Токен №${t.id}`,
        }))}
      />
      {unknown > 0 && (
        <p className="small muted" style={{ marginTop: 10, marginBottom: 0 }}>
          {plural(unknown, ['символ', 'символа', 'символов'])} с «?» не встречались в обучающем корпусе. Настоящие токенизаторы работают с байтами, поэтому у них
          неизвестных символов не бывает.
        </p>
      )}
    </WidgetFrame>
  );
}
