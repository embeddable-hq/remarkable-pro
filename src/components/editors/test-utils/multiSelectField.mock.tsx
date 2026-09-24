export const MultiSelectFieldMock = ({
  values,
  onChange,
  onSearch,
  isClearable,
  placeholder,
  noOptionsMessage,
  showSelectAll,
  showApplyButton,
  selectAllLabel,
  deselectAllLabel,
  options,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  onSearch: (v: string) => void;
  isClearable?: boolean;
  placeholder?: string;
  noOptionsMessage?: string;
  showSelectAll?: boolean;
  showApplyButton?: boolean;
  selectAllLabel?: string;
  deselectAllLabel?: string;
  options: { value: string; label: string }[];
}) => (
  <div
    data-testid="multi-select"
    data-values={values.join(',')}
    data-clearable={String(isClearable ?? false)}
    data-placeholder={placeholder ?? ''}
    data-no-options-message={noOptionsMessage ?? ''}
    data-show-select-all={String(showSelectAll ?? false)}
    data-show-apply-button={String(showApplyButton ?? true)}
    data-select-all-label={selectAllLabel ?? ''}
    data-deselect-all-label={deselectAllLabel ?? ''}
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
