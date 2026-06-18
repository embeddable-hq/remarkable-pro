import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import CloudDownload from '../../assets/icons/cloud-download.svg';
import PhotoDown from '../../assets/icons/photo-down.svg';
import { exportCSV, exportPNG, exportXLSX } from '../utils/export.utils';
import { Theme } from '../theme.types';
import { ExportOptionTypeOptions } from '../../components/types/ExportOption.type.emb';

export type ChartCardMenuOptionOnClickProps = {
  title?: string;
  data?: DataResponse['data'];
  dimensionsAndMeasures?: (Dimension | Measure)[];
  containerRef?: React.RefObject<HTMLDivElement | null>;
  theme: Theme;
  onCustomDownload?: (props: (props: ChartCardMenuOptionOnClickProps) => void) => void;
};

export type ChartCardMenuOption = {
  value: string;
  labelKey: string;
  iconSrc?: string;
  onClick: (props: ChartCardMenuOptionOnClickProps) => void;
};

export const defaultChartMenuProOptions: ChartCardMenuOption[] = [
  {
    value: ExportOptionTypeOptions.csv,
    labelKey: 'charts.menuOptions.downloadCSV',
    onClick: exportCSV,
    iconSrc: CloudDownload,
  },
  {
    value: ExportOptionTypeOptions.xlsx,
    labelKey: 'charts.menuOptions.downloadXLSX',
    onClick: exportXLSX,
    iconSrc: CloudDownload,
  },
  {
    value: ExportOptionTypeOptions.png,
    labelKey: 'charts.menuOptions.downloadPNG',
    onClick: exportPNG,
    iconSrc: PhotoDown,
  },
] as const;
