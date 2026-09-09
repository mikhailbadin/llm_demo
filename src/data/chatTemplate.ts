export const SPECIAL = {
  start: '<|im_start|>',
  end: '<|im_end|>',
} as const;

export interface ChatParts {
  system: string;
  user: string;
  assistant: string;
}

export interface TemplateSegment {
  kind: 'special' | 'system' | 'user' | 'assistant' | 'plain';
  text: string;
}

/** Собирает «сырой» текст, который на самом деле видит модель. */
export function buildChatSegments(p: ChatParts): TemplateSegment[] {
  const segs: TemplateSegment[] = [];
  if (p.system.trim()) {
    segs.push({ kind: 'special', text: `${SPECIAL.start}system\n` }, { kind: 'system', text: p.system }, { kind: 'special', text: `${SPECIAL.end}\n` });
  }
  segs.push({ kind: 'special', text: `${SPECIAL.start}user\n` }, { kind: 'user', text: p.user }, { kind: 'special', text: `${SPECIAL.end}\n` });
  segs.push({ kind: 'special', text: `${SPECIAL.start}assistant\n` });
  if (p.assistant.trim()) segs.push({ kind: 'assistant', text: p.assistant });
  return segs;
}

export interface PromptTechnique {
  id: 'zero' | 'few' | 'cot' | 'rag';
  label: string;
  title: string;
  prompt: string;
  highlight: string[];
  why: string;
}

export const PROMPT_TECHNIQUES: PromptTechnique[] = [
  {
    id: 'zero',
    label: 'Инструкция',
    title: 'Zero-shot: просто попросить',
    prompt: 'Определи тональность отзыва: положительная, отрицательная или нейтральная.\n\nОтзыв: «Доставка задержалась на неделю, но курьер был вежливый».\nТональность:',
    highlight: ['Определи тональность', 'Тональность:'],
    why: 'Ясная задача, формат ответа и «хвост», который модель должна продолжить. Модель дописывает самое вероятное — и это наш ответ.',
  },
  {
    id: 'few',
    label: 'Few-shot',
    title: 'Few-shot: показать примеры',
    prompt: 'Отзыв: «Всё пришло вовремя, качество отличное». Тональность: положительная\nОтзыв: «Товар сломался через день». Тональность: отрицательная\nОтзыв: «Обычный чайник, ничего особенного». Тональность: нейтральная\nОтзыв: «Доставка задержалась, но курьер был вежливый». Тональность:',
    highlight: ['положительная', 'отрицательная', 'нейтральная'],
    why: 'Примеры в контексте задают шаблон. Модель «видит» закономерность и продолжает её — никакого дообучения не нужно.',
  },
  {
    id: 'cot',
    label: 'Цепочка рассуждений',
    title: 'Chain-of-thought: думать вслух',
    prompt: 'В корзине 12 яблок. Утром съели треть, вечером добавили 5. Сколько яблок в корзине?\n\nРассуждай по шагам, а потом дай ответ.',
    highlight: ['Рассуждай по шагам'],
    why: 'Каждый сгенерированный токен становится частью контекста. Промежуточные шаги — это «черновик», на который модель опирается, чтобы не ошибиться в итоге.',
  },
  {
    id: 'rag',
    label: 'RAG',
    title: 'RAG: подложить факты',
    prompt: 'Документ: «Магазин работает с 9:00 до 21:00 без выходных. Самовывоз — с 10:00».\n\nОтветь на вопрос, используя только документ.\nВопрос: во сколько можно забрать заказ?',
    highlight: ['Документ:', 'используя только документ'],
    why: 'Модель не помнит ваш магазин, но отлично читает то, что лежит в контексте. Найденные документы подкладывают в промпт — и ответ опирается на факты, а не на догадки.',
  },
];
