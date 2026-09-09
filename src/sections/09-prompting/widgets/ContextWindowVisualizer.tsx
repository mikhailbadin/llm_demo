import { useMemo, useState } from 'react';
import { Button, SegmentedControl, Slider, WidgetFrame } from '@/components/ui';
import { BPE_MODEL } from '@/data/model';
import { tokenizeBpe } from '@/lib/bpe';
import { plural } from '@/lib/format';
import { theme } from '@/styles/theme';

interface Msg {
  role: 'system' | 'user' | 'assistant';
  text: string;
}
const INITIAL: Msg[] = [
  { role: 'system', text: 'Ты — вежливый помощник. Отвечай кратко.' },
  { role: 'user', text: 'Привет! Меня зовут Миша, и я учусь понимать языковые модели.' },
  { role: 'assistant', text: 'Привет, Миша! Отличная цель. С чего начнём — с токенов или сразу с внимания?' },
  { role: 'user', text: 'Давай с токенов. Что такое BPE?' },
  { role: 'assistant', text: 'BPE — способ построить словарь подслов: начинаем с символов и склеиваем самые частые пары.' },
];
const ROLE_LABEL = { system: 'system', user: 'пользователь', assistant: 'ассистент' };
const ROLE_COLOR = { system: theme.accent2, user: theme.accent, assistant: theme.warn };

export function ContextWindowVisualizer() {
  const [msgs, setMsgs] = useState<Msg[]>(INITIAL);
  const [window_, setWindow] = useState(96);
  const [role, setRole] = useState<'user' | 'assistant'>('user');
  const [draft, setDraft] = useState('А почему русский текст дороже английского?');
  const counted = useMemo(() => msgs.map((m) => ({ ...m, n: tokenizeBpe(m.text, BPE_MODEL).length + 4 })), [msgs]);
  const total = counted.reduce((s, m) => s + m.n, 0);

  // окно — последние N токенов: идём с конца и отмечаем, что помещается
  let acc = 0;
  const visible = counted.map(() => false);
  for (let i = counted.length - 1; i >= 0; i--) {
    if (acc + counted[i].n <= window_) {
      visible[i] = true;
      acc += counted[i].n;
    } else break;
  }
  const lost = counted.filter((_, i) => !visible[i]).length;

  return (
    <WidgetFrame
      title="Контекстное окно"
      icon="🪟"
      help="Каждое сообщение стоит сколько-то токенов (+4 служебных на роль). Ползунок задаёт размер окна. Когда диалог не помещается, старые сообщения выпадают — модель их буквально не видит. Добавьте несколько сообщений и посмотрите, как «забывается» имя собеседника."
      onReset={() => {
        setMsgs(INITIAL);
        setWindow(96);
      }}
      note="У настоящих моделей окно — от 8 тысяч до миллиона токенов, но принцип тот же: всё, что не поместилось, для модели не существует. Поэтому длинные диалоги «забывают» начало, а важные инструкции стоит держать в системном промпте, который всегда остаётся."
    >
      <Slider label="Размер окна" value={window_} min={64} max={256} step={8} onChange={setWindow} format={(v) => plural(v, ['токен', 'токена', 'токенов'])} />
      <div style={{ margin: '6px 0 12px' }}>
        <div className="row row--between small muted" style={{ marginBottom: 4 }}>
          <span>
            использовано {Math.min(acc, window_)} / {window_}
          </span>
          <span>всего в диалоге: {total}</span>
        </div>
        <div style={{ height: 12, borderRadius: 6, background: theme.bg2, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ width: `${Math.min(100, (acc / window_) * 100)}%`, height: '100%', background: acc >= window_ * 0.9 ? theme.danger : theme.accent, transition: 'width 0.3s' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
        {counted.map((m, i) => (
          <div key={i} className="card" style={{ padding: '8px 12px', opacity: visible[i] ? 1 : 0.35, borderColor: visible[i] ? undefined : theme.danger, transition: 'opacity 0.3s', fontSize: 14 }}>
            <div className="row row--between small">
              <span style={{ color: ROLE_COLOR[m.role], fontWeight: 600 }}>{ROLE_LABEL[m.role]}</span>
              <span className="mono muted">
                {m.n} ток.{!visible[i] && <span style={{ color: theme.danger }}> · модель этого больше не видит</span>}
              </span>
            </div>
            <div>{m.text}</div>
          </div>
        ))}
      </div>
      <div className="row" style={{ alignItems: 'flex-end' }}>
        <SegmentedControl
          value={role}
          onChange={setRole}
          options={[
            { value: 'user', label: 'пользователь' },
            { value: 'assistant', label: 'ассистент' },
          ]}
        />
        <input className="input" style={{ flex: 1, minWidth: 200 }} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Текст сообщения" />
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            if (!draft.trim()) return;
            setMsgs((m) => [...m, { role, text: draft.trim() }]);
            setRole((r) => (r === 'user' ? 'assistant' : 'user'));
            setDraft(role === 'user' ? 'Потому что словарь обучен в основном на английском, и русские слова дробятся на кусочки.' : 'А как это исправить?');
          }}
        >
          Добавить
        </Button>
      </div>
      {acc === 0 && counted.length > 0 && (
        <p className="small" style={{ color: theme.danger, margin: '10px 0 0' }}>
          В окно не помещается даже последнее сообщение целиком ({counted[counted.length - 1].n} ток.). В такой ситуации приложению приходится обрезать сам текст —
          иначе модели нечего показать.
        </p>
      )}
      {lost > 0 && acc > 0 && (
        <p className="small" style={{ color: theme.warn, margin: '10px 0 0' }}>
          {plural(lost, ['сообщение выпало', 'сообщения выпали', 'сообщений выпало'])} из окна. Если среди них было имя собеседника — модель его «забыла».
        </p>
      )}
    </WidgetFrame>
  );
}
