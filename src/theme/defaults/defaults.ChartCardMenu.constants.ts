import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import CloudDownload from '../../assets/icons/cloud-download.svg';
import PhotoDown from '../../assets/icons/photo-down.svg';
import ArrowsMaximize from '../../assets/icons/arrows-maximize.svg';
import { exportCSV, exportPNG, exportXLSX } from '../utils/export.utils';
import { Theme } from '../theme.types';
import { ExportOptionTypeOptions } from '../../components/types/ExportOption.type.emb';

/** Settings a theme can attach to a chart menu option. Currently only used by PNG export. */
export type ChartCardMenuOptionSettings = {
  /** PNG only. Any valid CSS color for the generated image. Transparent when omitted. */
  pngBackgroundColor?: string;
  /** PNG only. Export the whole card (title and description included), not just the chart body. */
  captureFullCard?: boolean;
};

export type ChartCardMenuOptionOnClickProps = {
  title?: string;
  data?: DataResponse['data'];
  dimensionsAndMeasures?: (Dimension | Measure)[];
  containerRef?: React.RefObject<HTMLDivElement | null>;
  cardRef?: React.RefObject<HTMLDivElement | null>;
  theme: Theme;
  options?: ChartCardMenuOptionSettings;
  onCustomDownload?: (props: (props: ChartCardMenuOptionOnClickProps) => void) => void;
};

export type ChartCardMenuOption = {
  value: string;
  labelKey: string;
  iconSrc?: string;
  /** Instant actions run immediately: no loading state and no onCustomDownload interception. */
  isInstantAction?: boolean;
  options?: ChartCardMenuOptionSettings;
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
  {
    value: ExportOptionTypeOptions.maximize,
    labelKey: 'charts.menuOptions.maximize',
    // Maximize state lives in ChartCard, which always overrides this onClick.
    onClick: () => {},
    iconSrc: ArrowsMaximize,
    isInstantAction: true,
  },
] as const;
