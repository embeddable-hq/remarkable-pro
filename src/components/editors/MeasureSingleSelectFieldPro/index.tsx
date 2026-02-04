import { Measure } from '@embeddable.com/core';
import { EditorCard } from '../shared/EditorCard/EditorCard';
import { resolveI18nProps } from '../../component.utils';
import { ChartCardHeaderProps } from '../../charts/shared/ChartCard/ChartCard';
import { Theme } from '../../../theme/theme.types';
import { useTheme } from '@embeddable.com/react';
import { i18nSetup } from '../../../theme/i18n/i18n';
import { DimensionAndMeasureSingleSelectField } from '../shared/DimensionAndMeasureSingleSelectField/DimensionAndMeasureSingleSelectField';

type MeasureSingleSelectFieldProProps = {
  selectedMeasure?: Measure;
  measureOptions: Measure[];
  placeholder?: string;
  clearable?: boolean;
  onChange: (value: Measure | undefined) => void;
} & ChartCardHeaderProps;

const MeasureSingleSelectFieldPro = (props: MeasureSingleSelectFieldProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const { selectedMeasure, measureOptions, clearable, onChange } = props;
  const { title, description, tooltip, placeholder } = resolveI18nProps(props);

  return (
    <EditorCard title={title} description={description} tooltip={tooltip}>
      <DimensionAndMeasureSingleSelectField<Measure>
        selectedValue={selectedMeasure}
        options={measureOptions}
        placeholder={placeholder}
        clearable={clearable}
        onChange={onChange}
      />
    </EditorCard>
  );
};

export default MeasureSingleSelectFieldPro;
