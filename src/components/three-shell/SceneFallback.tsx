export function SceneFallback({ loading, message }: { loading?: boolean; message?: string }) {
  return (
    <div className="scene__fallback" role={loading ? 'status' : undefined}>
      <div>
        {loading && <div className="scene__loader" aria-hidden="true" />}
        {loading ? 'Загружаем 3D-сцену…' : (message ?? '3D недоступно на этом устройстве. Текст экскурсии всё равно можно прочитать ниже.')}
      </div>
    </div>
  );
}
