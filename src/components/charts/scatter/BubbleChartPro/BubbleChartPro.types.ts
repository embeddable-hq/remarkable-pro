import type { BubbleChartInputPoint } from '@embeddable.com/remarkable-ui';
import type { ScatterChartProOptionsClickArg } from '../ScatterChartPro/ScatterChartPro.types';

export type BubblePoint = BubbleChartInputPoint & { rowIndex: number };

export type BubbleChartProOptionsClickArg = ScatterChartProOptionsClickArg & {
  sizeMeasureValue: string;
};
