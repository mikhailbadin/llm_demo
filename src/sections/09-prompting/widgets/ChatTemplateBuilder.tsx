import { useState } from 'react';
import { WidgetFrame } from '@/components/ui';
import { buildChatSegments } from '@/data/chatTemplate';

export function ChatTemplateBuilder() {
  const [system, setSystem] = useState('Ты — помощник по языковым моделям. Отвечай кратко и по-русски.');
  const [user, setUser] = useState('Что такое температура при генерации?');
  const [assistant, setAssistant] = useState('');
  const segs = buildChatSegments({ system, user, assistant });
  return (
    <WidgetFrame
      title="Что на самом деле видит модель"
      icon="🧾"
      help="Заполните поля диалога. Справа — та самая строка, которая подаётся модели: роли превращаются в специальные токены, а ответ ассистента — это просто продолжение текста после «assistant»."
      onReset={() => {
        setSystem('Ты — помощник по языковым моделям. Отвечай кратко и по-русски.');
        setUser('Что такое температура при генерации?');
        setAssistant('');
      }}
      note="Никакой «магии ролей» нет: чат — это один длинный текст со служебными токенами, и модель дообучена продолжать его в нужном месте. Формат токенов у разных моделей отличается, идея одна."
    >
      <div className="grid-2">
        <div style={{ display: 'grid', gap: 10 }}>
          <div className="field">
            <label className="field__label"><span style={{ color: 'var(--accent-2)' }}>system — системный промпт</span></label>
            <textarea className="textarea" rows={2} value={system} onChange={(e) => setSystem(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label"><span style={{ color: 'var(--accent)' }}>user — сообщение пользователя</span></label>
            <textarea className="textarea" rows={2} value={user} onChange={(e) => setUser(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label"><span style={{ color: 'var(--warn)' }}>assistant — начало ответа (необязательно)</span></label>
            <textarea className="textarea" rows={2} value={assistant} onChange={(e) => setAssistant(e.target.value)} placeholder="оставьте пустым — здесь модель начнёт генерировать" />
          </div>
        </div>
        <div>
          <div className="small muted" style={{ marginBottom: 6 }}>
            Сырая последовательность → модель
          </div>
          <pre className="pre" style={{ minHeight: 200 }}>
            {segs.map((s, i) => (
              <span key={i} className={s.kind === 'special' ? 'hl-special' : s.kind === 'system' ? 'hl-sys' : s.kind === 'user' ? 'hl-user' : s.kind === 'assistant' ? 'hl-asst' : ''}>
                {s.text}
              </span>
            ))}
            <span className="hl-asst" style={{ opacity: 0.6 }}>▌ генерация начинается здесь</span>
          </pre>
        </div>
      </div>
    </WidgetFrame>
  );
}
