# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Что это

Статический сайт-курс «Как работают LLM»: Vite 8 + React 19 + TypeScript, 10 разделов на русском, интерактивные виджеты и пять 3D-сцен на three.js / react-three-fiber. Никакого бэкенда и внешних API — все «модели» игрушечные и считаются в браузере. Программа курса и карта каталогов описаны в `README.md`.

Язык проекта — русский: тексты UI, комментарии в коде, сообщения коммитов.

## Команды

Нужен Node ≥ 22.12.

```bash
npm run dev          # http://localhost:5173 (в .claude/launch.json — тот же порт с --strictPort)
npm run build        # tsc --noEmit → vite build → копия dist/index.html в dist/404.html
npm run preview      # раздаёт dist/ по http://localhost:4173/llm_demo/
npm test             # vitest run, только src/lib/**/*.test.ts, environment: node
npm test -- bpe      # один файл по подстроке имени (src/lib/__tests__/bpe.test.ts)
npm run lint         # eslint .
npm run typecheck    # tsc --noEmit
```

В dev первая загрузка каждой 3D-сцены занимает несколько секунд — Vite компилирует чанк на лету; это не баг.

## Деплой на GitHub Pages

`.github/workflows/deploy.yml` на каждый push в `master` гоняет lint → test → build и публикует `dist/` через `actions/deploy-pages` (в настройках репозитория Source = GitHub Actions). Сайт живёт как проектная страница на `https://mikhailbadin.github.io/llm_demo/`, из чего следует:

- `vite.config.ts` задаёт `base: '/llm_demo/'`; при переименовании репозитория менять здесь.
- Роутер создаётся с `basename: import.meta.env.BASE_URL` (`src/app/router.tsx`).
- Vite переписывает пути только в `index.html`. Любой URL на файл из `public/`, собранный в коде, должен идти через `` `${import.meta.env.BASE_URL}имя` `` — строка `"/favicon.svg"` в JSX уйдёт в бандл как есть и на Pages сломается.
- `404.html` — копия `index.html`: так Pages отдаёт SPA по прямой ссылке на раздел; трюк живёт в скрипте `build`, не убирать.

## Архитектура

### Разделы: один реестр

`src/sections/registry.ts` — единственный источник правды о разделах: `id`, `slug`, `order`, `has3d`, `minutes` и ленивый `component`. От него зависят сайдбар, главная, футер-навигация, `SectionHero`, ссылки «Подробнее» в поповерах терминов и карта курса в глоссарии. Маршрут раздела — `/:slug`, в `router.tsx` перечислять разделы не нужно.

Новый раздел = запись в `SECTIONS` + литерал в `SectionId` (`sections/types.ts`) + папка `sections/NN-slug/index.tsx` с default-экспортом. Виджеты раздела лежат рядом в `widgets/` и оборачиваются в `WidgetFrame` (заголовок, «?», «Сбросить»).

### 3D-сцены: стор общий, three — только за границей чанка

Каждая сцена в `src/scenes/<Name>/` состоит из двух файлов с разными правами на импорты:

- `store.ts` — zustand-стор, созданный один раз на уровне модуля через `createSceneStore(initialParams, tour)` из `scenes/store.ts`. Импортирует только `lib/`, `data/` и zustand. Его читают и DOM-панель управления (`sections/NN/widgets/*Overlay.tsx`), и канвас.
- `index.tsx` — сам канвас: default-экспорт компонента `SceneProps = { store, active }`, регистрируется в `scenes/registry.ts` (`SceneId` + ленивый загрузчик). Только здесь и в `src/components/three/` разрешены импорты `three`, `@react-three/fiber`, `@react-three/drei`.

Раздел вставляет сцену через `SceneContainer` из `components/three-shell/` (заголовок, тулбар, ленивая загрузка по `useInView`, экскурсия, фолбэк без WebGL, защита от перехвата скролла). `three-shell` тоже не импортирует three. Благодаря этому three.js (~250 КБ gz) лежит в отдельном чанке и грузится, только когда сцена подъезжает к экрану; входной чанк ~95 КБ gz. Проверка инварианта:

```bash
grep -rln "from 'three'\|from '@react-three" src | grep -v "^src/components/three/\|^src/scenes/[A-Za-z]*/index.tsx"   # должно быть пусто
```

Протокол стора, о котором стоит знать:
- `TourStep` может задать `camera`, `highlight`, `params`, `select` — `goToStep` применяет их все разом; экскурсия объявляется в `store.ts` рядом со стором.
- Камера двигается не напрямую, а через `requestCamera(pose)` / `resetCamera()` — `CameraRig` реагирует на `nonce`. `CameraRig` также отодвигает ракурс на узких экранах (`REFERENCE_ASPECT`).
- Колесо мыши масштабирует только после клика по сцене (`cameraActive`); `SceneContainer` сбрасывает флаг при клике вне сцены и при уходе с экрана.
- `active` = сцена в зоне видимости; `SceneCanvas` переключает `frameloop` в `'never'`, когда сцена не видна. `SceneContainer` вызывает `store.reset()` при размонтировании.

### Детерминизм и данные

Все данные — маленькие, зашитые в `src/data/` (корпус на 90 предложений, BPE-корпус, 84 вручную построенных эмбеддинга, глоссарий). Случайность только через `createRng(seed)` из `lib/rng.ts` (mulberry32); `Math.random` в `src/` не используется — одинаковый seed должен давать одинаковую картинку. Чистая математика живёт в `src/lib/` и только она покрыта тестами.

### Тема

Цвета объявлены дважды: CSS-переменные в `styles/global.css` и те же hex-строки в `styles/theme.ts` — для SVG-графиков и three.js, где переменные недоступны. Меняя цвет, править оба места. `CLUSTER_COLORS`/`CHIP_COLORS` там же.

### Прочее

- Алиас `@/` → `src/` (tsconfig + vite).
- `vite.config.ts` использует `defineConfig` из `vitest/config`; `optimizeDeps.include` перечисляет тяжёлые зависимости ленивых сцен — без него в dev появляется вторая копия React и «Invalid hook call». Новую зависимость сцен добавлять туда же.
- ESLint: правила React Compiler (`react-hooks/set-state-in-effect`, `react-hooks/refs`) намеренно выключены — анимации и наблюдатели управляются вручную. Неиспользуемые аргументы — с префиксом `_`.
- Термины в тексте — `<Term id="…">` с `TermId` из `data/glossary.ts`; поповер сам подставит определение и ссылку на раздел. Формулы — `<Formula tex>` / `<M tex>` (KaTeX).

### Поиск по коду

Индекс `ast-index` собран для этого репозитория. Для поиска классов, символов, использований и зависимостей — сначала `ast-index` (`search`, `symbol`, `class`, `usages`, `outline`, `imports`), grep — только для регулярок, строковых литералов и текста комментариев. Полная памятка команд и особенностей версии — в `.claude/rules/ast-index.md`. После `git pull` — `ast-index update`.
