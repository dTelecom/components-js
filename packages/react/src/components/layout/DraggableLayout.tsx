import type { TrackReferenceOrPlaceholder } from '@dtelecom/components-core';
import { isTrackReference } from '@dtelecom/components-core';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { TrackContext } from '../../context';
import { cloneSingleChild } from '../../utils';

/** @public */
export interface DraggableLayoutProps extends React.HTMLAttributes<HTMLMediaElement> {
  tracks: TrackReferenceOrPlaceholder[];
  chatOpen?: boolean;
  children: React.ReactNode;
}

export const DraggableLayout = ({ tracks,chatOpen, ...props }: DraggableLayoutProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [offset, setOffset] = useState({ x: 16, y: 16 });
  const outerDivRef = useRef<HTMLDivElement>(null);
  const innerDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // @ts-ignore
    outerDivRef.current = document.getElementById('draggable-layout');
    if (outerDivRef.current && innerDivRef.current) {
      setPosition({
        x: outerDivRef.current.clientWidth - innerDivRef.current!.clientWidth - 16,
        y: 16,
      });
    }
  }, []);

  useEffect(() => {
    if (outerDivRef.current && innerDivRef.current) {
      setPosition({
        x: outerDivRef.current.clientWidth - innerDivRef.current!.clientWidth - 16,
        y: 16,
      });
    }
  }, [chatOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    if (!innerDivRef.current) return;
    setOffset({
      x: e.clientX - innerDivRef.current.getBoundingClientRect().left,
      y: e.clientY - innerDivRef.current.getBoundingClientRect().top,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    if (!outerDivRef.current || !innerDivRef.current) return;

    const outerRect = outerDivRef.current.getBoundingClientRect();
    const innerRect = innerDivRef.current.getBoundingClientRect();

    let newX = e.clientX - offset.x;
    let newY = e.clientY - offset.y;

    const minX = outerRect.left;
    const minY = outerRect.top;
    const maxX = outerRect.right - innerRect.width;
    const maxY = outerRect.bottom - innerRect.height;

    newX = Math.max(minX, Math.min(newX, maxX));
    newY = Math.max(minY, Math.min(newY, maxY));

    setPosition({
      x: newX - outerRect.left,
      y: newY - outerRect.top,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleWindowResize = () => {
    if (outerDivRef.current && innerDivRef.current) {
      setPosition({
        x: outerDivRef.current.clientWidth - innerDivRef.current.clientWidth - 16,
        y: 16,
      });
    }
  }

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleWindowResize)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [isDragging, offset]);

  return (
    <>
      {tracks.map((trackReference) => {
        const trackSource = isTrackReference(trackReference)
          ? trackReference.publication.source
          : trackReference.source;
        return (
          <div
            ref={innerDivRef}
            style={{ position: 'absolute', left: position.x, top: position.y, width: '30%', maxWidth: '260px', zIndex: 10 }}
            onMouseDown={handleMouseDown}
          >
            <TrackContext.Provider
              value={trackReference}
              key={`${trackReference.participant.identity}_${trackSource}`}
            >
              {cloneSingleChild(props.children)}
            </TrackContext.Provider>
          </div>
        );
      })}
    </>
  );
};
