import type { TrackReferenceOrPlaceholder } from '@dtelecom/components-core';
import { getScrollBarWidth } from '@dtelecom/components-core';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useSize } from '../../hooks/internal';
import { useVisualStableUpdate } from '../../hooks';
import { TrackLoop } from '../TrackLoop';
import { GridLayout } from './GridLayout';

const MIN_HEIGHT = 130;
const MIN_WIDTH = 140;
const MIN_VISIBLE_TILES = 1;
const ASPECT_RATIO = 16 / 10;
const ASPECT_RATIO_INVERT = (1 - ASPECT_RATIO) * -1;

const CAROUSEL_GRID_LAYOUTS = [
  {
    columns: 2,
    rows: 1,
    name: "1x2",
    minTiles: 1,
    maxTiles: 3,
    minWidth: 0,
    minHeight: 0,
  },
  {
    columns: 3,
    rows: 1,
    name: "1x3",
    minTiles: 1,
    maxTiles: 3,
    minWidth: 0,
    minHeight: 0,
  }
];

/** @public */
export interface CarouselLayoutProps extends React.HTMLAttributes<HTMLMediaElement> {
  tracks: TrackReferenceOrPlaceholder[];
  children: React.ReactNode;
  /** Place the tiles vertically or horizontally next to each other.
   * If undefined orientation is guessed by the dimensions of the container. */
  orientation?: 'vertical' | 'horizontal';
}

/**
 * @deprecated Renamed to [[CarouselLayout]]
 */
export const CarouselView = CarouselLayout;

/**
 * The `CarouselLayout` displays a list of tracks horizontally or vertically.
 * Depending on the size of the container, the carousel will display as many tiles as possible and overflows the rest.
 * The CarouselLayout uses the `useVisualStableUpdate` hook to ensure that tile reordering due to track updates
 * is visually stable but still moves the important tiles (speaking participants) to the front.
 *
 * @example
 * ```tsx
 * const tracks = useTracks();
 * <CarouselLayout tracks={tracks}>
 *   <ParticipantTile />
 * </CarouselLayout>
 * ```
 * @public
 */
export function CarouselLayout({ tracks, orientation, ...props }: CarouselLayoutProps) {
  const asideEl = React.useRef<HTMLDivElement>(null);
  const [prevTiles, setPrevTiles] = React.useState(0);
  const [carouselOrientation, setCarouselOrientation] = useState(orientation ? orientation : window.innerWidth > 600 ? 'vertical' : 'horizontal');
  const { width, height } = useSize(asideEl);

  useEffect(() => {
    const resizeListener = () => setCarouselOrientation(window.innerWidth > 600 ? 'vertical' : 'horizontal');
    window.addEventListener("resize", resizeListener);

    resizeListener();
    return () => {
      window.removeEventListener("resize", resizeListener);
    };
  }, []);

  const tileSpan =
    carouselOrientation === 'vertical'
      ? Math.max(width * ASPECT_RATIO_INVERT, MIN_HEIGHT)
      : Math.max(height * ASPECT_RATIO, MIN_WIDTH);
  const scrollBarWidth = getScrollBarWidth();

  const tilesThatFit =
    carouselOrientation === 'vertical'
      ? Math.max((height - scrollBarWidth) / tileSpan, MIN_VISIBLE_TILES)
      : Math.max((width - scrollBarWidth) / tileSpan, MIN_VISIBLE_TILES);

  let maxVisibleTiles = Math.round(tilesThatFit);
  if (Math.abs(tilesThatFit - prevTiles) < 0.5) {
    maxVisibleTiles = Math.round(prevTiles);
  } else if (prevTiles !== tilesThatFit) {
    setPrevTiles(tilesThatFit);
  }

  const sortedTiles = useVisualStableUpdate(tracks, maxVisibleTiles);

  React.useLayoutEffect(() => {
    if (asideEl.current) {
      asideEl.current.dataset.lkOrientation = carouselOrientation;
      asideEl.current.style.setProperty('--lk-max-visible-tiles', maxVisibleTiles.toString());
    }
  }, [maxVisibleTiles, carouselOrientation]);

  return (
    <aside
      key={carouselOrientation}
      className="lk-carousel"
      ref={asideEl} {...props}>
      {carouselOrientation === 'vertical' ? (
        <TrackLoop tracks={sortedTiles}>{props.children}</TrackLoop>
      ) : (
        <GridLayout
          tracks={tracks}
          gridLayouts={CAROUSEL_GRID_LAYOUTS}
          style={{ width: '100%' }}
        >
          {props.children}
        </GridLayout>
      )}
    </aside>
  );
}
