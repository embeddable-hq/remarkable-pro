import { describe, it, expect, vi } from 'vitest';
import { getLineChartProOptionsOnClick, LineChartProOptionsClick } from './lines.utils';
import type { ChartEvent } from 'chart.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeEvent = (): ChartEvent => ({ native: new MouseEvent('click') }) as unknown as ChartEvent;

type SliceItem = { index: number; datasetIndex: number };

const makeChart = (options: {
  labels?: (string | number)[];
  datasets?: { rawLabel?: string; data?: (number | null | undefined)[] }[];
  slice?: SliceItem[];
  nearest?: SliceItem[];
}) => {
  const { labels = [], datasets = [], slice = [], nearest = [] } = options;
  return {
    data: { labels, datasets },
    getElementsAtEventForMode: vi.fn((_: unknown, mode: string) => {
      if (mode === 'x') return slice;
      if (mode === 'nearest') return nearest;
      return [];
    }),
  };
};

const invokeClick = (
  chart: ReturnType<typeof makeChart>,
  onLineClicked: LineChartProOptionsClick,
) => {
  const options = getLineChartProOptionsOnClick({ onLineClicked });
  options.onClick!(makeEvent(), [], chart as never);
};

// ---------------------------------------------------------------------------

describe('getLineChartProOptionsOnClick', () => {
  describe('when onLineClicked is not provided', () => {
    it('returns an empty object', () => {
      expect(getLineChartProOptionsOnClick({})).toEqual({});
    });

    it('does not include an onClick handler', () => {
      const options = getLineChartProOptionsOnClick({});
      expect(options.onClick).toBeUndefined();
    });
  });

  describe('when onLineClicked is provided', () => {
    it('returns an object with an onClick handler', () => {
      const options = getLineChartProOptionsOnClick({ onLineClicked: vi.fn() });
      expect(typeof options.onClick).toBe('function');
    });

    describe('when the click lands on an empty area (no slice)', () => {
      it('calls onLineClicked with null values', () => {
        const onLineClicked = vi.fn();
        const chart = makeChart({ slice: [] });
        invokeClick(chart, onLineClicked);
        expect(onLineClicked).toHaveBeenCalledWith({
          dimensionValue: null,
          groupingDimensionValue: null,
        });
      });
    });

    describe('when a slice is found', () => {
      it('resolves dimensionValue from chart labels at xIndex', () => {
        const onLineClicked = vi.fn();
        const chart = makeChart({
          labels: ['Jan', 'Feb', 'Mar'],
          datasets: [{ rawLabel: 'Series A', data: [10, 20, 30] }],
          slice: [{ index: 1, datasetIndex: 0 }],
          nearest: [{ index: 1, datasetIndex: 0 }],
        });
        invokeClick(chart, onLineClicked);
        expect(onLineClicked).toHaveBeenCalledWith(
          expect.objectContaining({ dimensionValue: 'Feb' }),
        );
      });

      it('resolves groupingDimensionValue from the nearest dataset rawLabel', () => {
        const onLineClicked = vi.fn();
        const chart = makeChart({
          labels: ['Jan', 'Feb'],
          datasets: [{ rawLabel: 'Series A', data: [10, 20] }],
          slice: [{ index: 0, datasetIndex: 0 }],
          nearest: [{ index: 0, datasetIndex: 0 }],
        });
        invokeClick(chart, onLineClicked);
        expect(onLineClicked).toHaveBeenCalledWith(
          expect.objectContaining({ groupingDimensionValue: 'Series A' }),
        );
      });

      it('uses null groupingDimensionValue when dataset has no rawLabel', () => {
        const onLineClicked = vi.fn();
        const chart = makeChart({
          labels: ['Jan'],
          datasets: [{ data: [5] }],
          slice: [{ index: 0, datasetIndex: 0 }],
          nearest: [{ index: 0, datasetIndex: 0 }],
        });
        invokeClick(chart, onLineClicked);
        expect(onLineClicked).toHaveBeenCalledWith(
          expect.objectContaining({ groupingDimensionValue: null }),
        );
      });

      describe('when nearest points to a different xIndex', () => {
        it('falls back to a slice element whose dataset has data at xIndex', () => {
          const onLineClicked = vi.fn();
          const chart = makeChart({
            labels: ['Jan', 'Feb'],
            datasets: [
              { rawLabel: 'Series A', data: [null, 20] },
              { rawLabel: 'Series B', data: [10, null] },
            ],
            slice: [
              { index: 1, datasetIndex: 0 },
              { index: 1, datasetIndex: 1 },
            ],
            // nearest points to index 0 — different from slice xIndex 1
            nearest: [{ index: 0, datasetIndex: 1 }],
          });
          invokeClick(chart, onLineClicked);
          // Series A has data[1] = 20 (non-null), so it should be picked
          expect(onLineClicked).toHaveBeenCalledWith({
            dimensionValue: 'Feb',
            groupingDimensionValue: 'Series A',
          });
        });
      });

      describe('when nearest is absent entirely', () => {
        it('calls onLineClicked with dimensionValue set and groupingDimensionValue undefined', () => {
          const onLineClicked = vi.fn();
          const chart = makeChart({
            labels: ['Jan', 'Feb'],
            datasets: [
              { rawLabel: 'Series A', data: [null, null] },
              { rawLabel: 'Series B', data: [null, null] },
            ],
            slice: [{ index: 1, datasetIndex: 0 }],
            nearest: [],
          });
          invokeClick(chart, onLineClicked);
          expect(onLineClicked).toHaveBeenCalledWith({
            dimensionValue: 'Feb',
            groupingDimensionValue: undefined,
          });
        });
      });

      it('resolves dimensionValue as a number when labels contain numbers', () => {
        const onLineClicked = vi.fn();
        const chart = makeChart({
          labels: [2022, 2023, 2024],
          datasets: [{ rawLabel: 'Revenue', data: [100, 200, 300] }],
          slice: [{ index: 2, datasetIndex: 0 }],
          nearest: [{ index: 2, datasetIndex: 0 }],
        });
        invokeClick(chart, onLineClicked);
        expect(onLineClicked).toHaveBeenCalledWith(
          expect.objectContaining({ dimensionValue: 2024 }),
        );
      });
    });
  });
});
