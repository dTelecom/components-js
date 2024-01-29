import { GRID_LAYOUTS, selectGridLayout } from '@dtelecom/components-core';
import type { GridLayoutDefinition } from '@dtelecom/components-core';
import * as React from 'react';
import { useSize } from './internal';

/**
 * The useGridLayout hook tries to select the best layout to fit all tiles.
 * If the available screen space is not enough, it will reduce the number of maximum visible
 * tiles and select a layout that still works visually within the given limitations.
 * As the order of tiles changes over time, the hook tries to keep visual updates to a minimum
 * while trying to display important tiles such as speaking participants or screen shares.
 * @public
 */
export function useGridLayout(
  /** HTML element that contains the grid. */
  gridElement: React.RefObject<HTMLDivElement>,
  /** Count of tracks that should get layed out */
  trackCount: number,
  gridLayouts: GridLayoutDefinition[] = GRID_LAYOUTS,
): { layout: GridLayoutDefinition } {
  const { width, height } = useSize(gridElement);

  const layout =
    width > 0 && height > 0
      ? selectGridLayout(gridLayouts, trackCount, width, height)
      : gridLayouts[0];

  React.useEffect(() => {
    if (gridElement.current && layout) {
      gridElement.current.style.setProperty('--lk-col-count', layout?.columns.toString());
      gridElement.current.style.setProperty('--lk-row-count', layout?.rows.toString());
    }
  }, [gridElement, layout]);

  return {
    layout,
  };
}
