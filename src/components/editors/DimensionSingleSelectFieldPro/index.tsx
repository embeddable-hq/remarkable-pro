import { Dimension } from '@embeddable.com/core';
import { EditorCard } from '../shared/EditorCard/EditorCard';
import { resolveI18nProps } from '../../component.utils';
import { ChartCardHeaderProps } from '../../charts/shared/ChartCard/ChartCard';
import { Theme } from '../../../theme/theme.types';
import { useTheme } from '@embeddable.com/react';
import { i18nSetup } from '../../../theme/i18n/i18n';
import { DimensionAndMeasureSingleSelectField } from '../shared/DimensionAndMeasureSingleSelectField/DimensionAndMeasureSingleSelectField';

type DimensionSingleSelectFieldProProps = {
  selectedDimension?: Dimension;
  dimensionOptions: Dimension[];
  placeholder?: string;
  clearable?: boolean;
  onChange: (value: Dimension | undefined) => void;
} & ChartCardHeaderProps;

const DimensionSingleSelectFieldPro = (props: DimensionSingleSelectFieldProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const { selectedDimension, dimensionOptions, clearable, onChange } = props;
  const { title, description, tooltip, placeholder } = resolveI18nProps(props);

  return (
    <EditorCard title={title} description={description} tooltip={tooltip}>
      <DimensionAndMeasureSingleSelectField<Dimension>
        selectedValue={selectedDimension}
        options={dimensionOptions}
        placeholder={placeholder}
        clearable={clearable}
        onChange={onChange}
      />
    </EditorCard>
  );
};

export default DimensionSingleSelectFieldPro;
