# ast-index Rules

## Mandatory Search Rules

1. **ALWAYS use ast-index FIRST** for any code search task
2. **NEVER duplicate results** — if ast-index found usages/implementations, that IS the complete answer
3. **DO NOT run grep "for completeness"** after ast-index returns results
4. **Use grep/Search ONLY when:**
   - ast-index returns empty results
   - Searching for regex patterns (ast-index uses literal match)
   - Searching for string literals inside code (`"some text"`)
   - Searching in comments content

## Why ast-index

ast-index is 17-69x faster than grep (1-10ms vs 200ms-3s) and returns structured, accurate results.

## Command Reference

| Task | Command | Time |
|------|---------|------|
| Universal search | `ast-index search "query"` | ~10ms |
| Find class/component | `ast-index class "ComponentName"` | ~1ms |
| Find symbol | `ast-index symbol "SymbolName"` | ~1ms |
| Find usages | `ast-index usages "SymbolName"` | ~8ms |
| Find implementations | `ast-index implementations "Interface"` | ~5ms |
| Call hierarchy | `ast-index call-tree "function" --depth 3` | ~1s |
| Find callers | `ast-index callers "functionName"` | ~1s |
| Module deps | `ast-index deps "module-name"` | ~10ms |
| File outline | `ast-index outline "src/path/File.tsx"` | ~1ms |
| Explore topic | `ast-index explore "query"` | ~1s |
| Changed files | `ast-index changed` | ~50ms |

## TypeScript/JavaScript-Specific Commands

| Task | Command |
|------|---------|
| Find React components | `ast-index class "SceneContainer"` |
| Find React hooks | `ast-index symbol "useInView"` |
| Find interfaces / props | `ast-index class "Props"` |
| Find types | `ast-index symbol "SectionId"` |
| Imports of a file | `ast-index imports "src/app/router.tsx"` |

Notes for this repo (ast-index v3.50.0):
- There is no `--kind` flag: use `symbol` / `class` instead of `search --kind`.
- `outline` and `imports` need a repo-relative path, not a bare file name.
- The index also covers `node_modules/**/*.d.ts`, so filter results to `src/` when you only want project code.

## Index Management

- `ast-index rebuild` — Full reindex (run once after clone)
- `ast-index update` — After git pull/merge
- `ast-index stats` — Show index statistics
