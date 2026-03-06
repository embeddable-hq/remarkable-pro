export const MultiSelectFieldMock = ({
  values,
  onChange,
  onSearch,
  isClearable,
  placeholder,
  noOptionsMessage,
  options,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  onSearch: (v: string) => void;
  isClearable?: boolean;
  placeholder?: string;
  noOptionsMessage?: string;
  options: { value: string; label: string }[];
}) => (
  <div
    data-testid="multi-select"
    data-values={values.join(',')}
    data-clearable={String(isClearable ?? false)}
    data-placeholder={placeholder ?? ''}
    data-no-options-message={noOptionsMessage ?? ''}
  >
    {options.map((o) => (
      <button
        key={o.value}
        data-testid={`option-${o.value}`}
        onClick={() => {
          const newValues = values.includes(o.value)
            ? values.filter((v) => v !== o.value)
            : [...values, o.value];
          onChange(newValues);
        }}
      >
        {o.label}
      </button>
    ))}
    <input data-testid="search-input" onChange={(e) => onSearch(e.target.value)} />
  </div>
);
