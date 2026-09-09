interface Tab<T extends string> {
  id: T;
  label: string;
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: readonly Tab<T>[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === value}
          className={`tabs__btn${t.id === value ? ' is-active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
