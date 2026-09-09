import { TableWrap, WidgetFrame } from '@/components/ui';
import { TOKEN_COST_EXAMPLES } from '@/data/bpeCorpus';
import { BPE_MODEL } from '@/data/model';
import { tokenizeBpe } from '@/lib/bpe';
import { fmtFixed } from '@/lib/format';

export function TokenCostCompare() {
  const rows = TOKEN_COST_EXAMPLES.map((e) => ({
    ...e,
    ruToy: tokenizeBpe(e.ru, BPE_MODEL).length,
    enToy: tokenizeBpe(e.en, BPE_MODEL).length,
  }));
  return (
    <WidgetFrame
      title="Сколько стоит русский текст в токенах"
      icon="🧾"
      help="Таблица сравнивает число токенов для одинаковых по смыслу фраз. «Настоящий токенизатор» — приблизительные значения для словарей современных моделей (обучены в основном на английском). «Наш BPE» обучен только на русских словах, поэтому у него всё наоборот — сравните две колонки."
      note="Словари больших моделей обучались в основном на английском, поэтому русские слова дробятся на 2–4 куска, а английские часто остаются целыми. Это значит: тот же смысл — больше токенов, дороже и с меньшим полезным контекстом."
    >
      <TableWrap>
        <table>
          <thead>
            <tr>
              <th>Фраза</th>
              <th>Настоящий токенизатор (учился на английском)</th>
              <th>Наш BPE (учился на русском)</th>
              <th>Символов</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ru}>
                <td>
                  <div>🇷🇺 {r.ru}</div>
                  <div className="muted">🇬🇧 {r.en}</div>
                </td>
                <td className="mono">
                  <div>≈ {r.ruReal}</div>
                  <div className="muted">≈ {r.enReal}</div>
                </td>
                <td className="mono">
                  <div>{r.ruToy}</div>
                  <div className="muted">{r.enToy}</div>
                </td>
                <td className="mono">
                  <div>{[...r.ru].length}</div>
                  <div className="muted">{[...r.en].length}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <p className="small" style={{ margin: '10px 0 0' }}>
        У настоящих моделей русский текст «дороже» английского в среднем в{' '}
        <strong>{fmtFixed(rows.reduce((s, r) => s + r.ruReal / r.enReal, 0) / rows.length, 1)} раза</strong>. А у нашего BPE всё зеркально: английский дороже русского в{' '}
        <strong>{fmtFixed(rows.reduce((s, r) => s + r.enToy / r.ruToy, 0) / rows.length, 1)} раза</strong>, ведь он не видел ни одного английского слова и разбирает их по буквам.
      </p>
      <p className="small muted" style={{ margin: '6px 0 0' }}>
        Это и есть главный вывод: «дорогим» становится тот язык, которого было мало в корпусе токенизатора. Дело не в самом языке, а в том, на чём учили словарь.
      </p>
    </WidgetFrame>
  );
}
