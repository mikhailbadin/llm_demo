import { Callout, Formula, M, SectionHero, Summary, Term } from '@/components/ui';
import { SceneContainer } from '@/components/three-shell/SceneContainer';
import { transformerStore } from '@/scenes/TransformerStack/store';
import { TransformerBlockDiagram } from './widgets/TransformerBlockDiagram';
import { PositionalEncodingHeatmap } from './widgets/PositionalEncodingHeatmap';
import { ParameterCalculator } from './widgets/ParameterCalculator';
import { TransformerOverlay } from './widgets/TransformerOverlay';

export default function TransformerSection() {
  return (
    <>
      <SectionHero
        id="transformer"
        learn={['Из чего состоит один блок трансформера и что такое остаточный поток', 'Как модель узнаёт порядок слов', 'Где именно «живут» миллиарды параметров и сколько это в гигабайтах']}
      />

      <h2>Блок за блоком</h2>
      <p>
        <Term id="transformer">Трансформер</Term> — это не один хитрый механизм, а стопка одинаковых блоков. Каждый блок делает две вещи: сначала{' '}
        <Term id="attention">внимание</Term> даёт токенам обменяться информацией, потом небольшая полносвязная сеть (<Term id="mlp">MLP</Term>) обрабатывает
        каждый токен по отдельности. Между ними — <Term id="layernorm">нормализация</Term> и сложение.
      </p>
      <Formula tex={String.raw`x \leftarrow x + \operatorname{Attn}(\operatorname{LN}(x)), \qquad x \leftarrow x + \operatorname{MLP}(\operatorname{LN}(x))`} caption={<>Две строки — весь блок. Обратите внимание на «x + …»: блок не заменяет вектор, а прибавляет к нему поправку.</>} />
      <p>
        Это «прибавляет» — важная деталь. Вектор каждого токена, который проходит через все блоки, называют <Term id="residual">остаточным потоком</Term>. Блоки
        по очереди дописывают в него информацию: первые — про синтаксис, средние — про смысл, последние — про то, какое слово должно быть следующим.
      </p>
      <TransformerBlockDiagram />

      <h2>Стек целиком</h2>
      <Callout kind="try">
        В сцене ниже — весь путь: токены, эмбеддинги, L блоков, выходной слой. Нажмите на блок, чтобы раскрыть его. Ползунок в панели меняет глубину. Экскурсия
        проведёт по потоку данных снизу вверх.
      </Callout>
      <SceneContainer
        sceneId="transformer-stack"
        title="Стек трансформера"
        store={transformerStore}
        overlay={<TransformerOverlay />}
        legend={<p>Частицы летят снизу вверх по остаточному потоку, меняя цвет по мере того, как блоки дописывают информацию. Оранжевые плиты — внимание, фиолетовые — MLP. Наверху — вероятности следующего токена.</p>}
      />

      <h2>Откуда модель знает порядок слов</h2>
      <p>
        У внимания есть слепое пятно: оно смотрит на множество токенов, а не на последовательность. «Кот съел рыбу» и «рыбу съел кот» для чистого внимания —
        один и тот же набор. Чтобы вернуть порядок, к эмбеддингу каждого токена прибавляют вектор, зависящий от позиции — это{' '}
        <Term id="positional-encoding">позиционное кодирование</Term>.
      </p>
      <Formula tex={String.raw`PE_{(pos,\,2i)} = \sin\!\left(\frac{pos}{10000^{2i/d}}\right), \qquad PE_{(pos,\,2i+1)} = \cos\!\left(\frac{pos}{10000^{2i/d}}\right)`} caption={<>Классический вариант из оригинальной статьи: синусы и косинусы разных частот. Современные модели чаще используют RoPE — поворот векторов запроса и ключа на угол, зависящий от позиции, — но идея та же: позиция становится частью вектора.</>} />
      <PositionalEncodingHeatmap />

      <h2>Сколько это параметров</h2>
      <p>
        Все матрицы во всех блоках, плюс таблица эмбеддингов, плюс <Term id="unembedding">выходной слой</Term> — это и есть <Term id="parameters">параметры</Term>{' '}
        модели. Их число задаётся
        всего несколькими размерами: длиной вектора <M tex="d" />, числом блоков <M tex="L" /> и размером словаря <M tex="|V|" />.
      </p>
      <Formula
        tex={String.raw`N \approx 12 \cdot L \cdot d^2 + |V| \cdot d`}
        caption={
          <>
            На один блок: 4d² во внимании (матрицы Q, K, V, O) и 8d² в MLP (расширение до 4d и обратно; в Llama MLP устроен иначе, но параметров в нём почти
            столько же). Плюс таблица эмбеддингов |V|·d. В GPT-2 и GPT-3 выходная матрица — та же таблица эмбеддингов, а обучаемые позиционные векторы добавляют
            ещё C·d; в Llama выходная матрица отдельная (ещё |V|·d), а позиции кодируются RoPE без параметров.
          </>
        }
      />
      <ParameterCalculator />
      <Callout kind="hint" title="Почему d² важнее L">
        Удвоение ширины d учетверяет число параметров в каждом блоке, удвоение глубины L — лишь удваивает. Поэтому большие модели растут «вширь» не медленнее, чем
        «ввысь».
      </Callout>

      <Summary>
        <ul>
          <li>Трансформер — стопка одинаковых блоков «внимание + MLP» с нормализацией и остаточными связями.</li>
          <li>Остаточный поток — вектор токена, который блоки не заменяют, а дополняют.</li>
          <li>Порядок слов добавляют позиционным кодированием; параметры считаются по формуле 12·L·d² + |V|·d.</li>
        </ul>
      </Summary>
    </>
  );
}
