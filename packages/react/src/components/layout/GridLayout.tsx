import * as React from 'react';
import type { UseParticipantsOptions } from '../../hooks';
import { useGridLayout, usePagination, useSwipe } from '../../hooks';
import { mergeProps } from '../../utils';
import type { GridLayoutDefinition, TrackReferenceOrPlaceholder } from '@dtelecom/components-core';
import { TrackLoop } from '../TrackLoop';
import { PaginationControl } from '../controls/PaginationControl';
import { PaginationIndicator } from '../controls/PaginationIndicator';

/** @public */
export interface GridLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Pick<UseParticipantsOptions, 'updateOnlyOn'> {
  children: React.ReactNode;
  tracks: TrackReferenceOrPlaceholder[];
  gridLayouts?: GridLayoutDefinition[];
  aiAgentEnabled?: boolean;
}

/**
 * The GridLayout component displays the nested participants in a grid where every participants has the same size.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <GridLayout tracks={tracks}>
 *     <ParticipantTile />
 *   </GridLayout>
 * <LiveKitRoom>
 * ```
 * @public
 */
export function GridLayout({ tracks, gridLayouts, aiAgentEnabled, ...props }: GridLayoutProps) {
  const gridEl = React.createRef<HTMLDivElement>();

  const orderedTracks = React.useMemo(() => {
    if (!aiAgentEnabled) {
      return tracks;
    }
    return tracks.sort((a) => {
      if (a.participant?.identity === 'ai_agent') {
        return -1;
      }
      return 1;
    });
  }, [tracks]);

  const elementProps = React.useMemo(
    () => mergeProps(props, { className: 'lk-grid-layout' }),
    [props],
  );
  const { layout } = useGridLayout(gridEl, orderedTracks.length, gridLayouts);
  const pagination = usePagination(layout.maxTiles, orderedTracks);

  useSwipe(gridEl, {
    onLeftSwipe: pagination.nextPage,
    onRightSwipe: pagination.prevPage,
  });

  return (
    <div
      ref={gridEl}
      data-lk-pagination={pagination.totalPageCount > 1} {...elementProps}>
      <TrackLoop tracks={pagination.tracks}>{props.children}</TrackLoop>
      {orderedTracks.length > layout.maxTiles && (
        <>
          <PaginationIndicator
            totalPageCount={pagination.totalPageCount}
            currentPage={pagination.currentPage}
          />
          <PaginationControl pagesContainer={gridEl} {...pagination} />
        </>
      )}
    </div>
  );
}
