import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export type VideoProps = {
  videoId?: string;
  width?: string;
  height?: string;
  margin?: string;
  borderRadius?: string;
  aspectRatio?: '16:9' | '4:3' | '1:1';
};

const defaultProps: VideoProps = {
  videoId: 'dQw4w9WgXcQ', // Default YouTube video
  width: '100%',
  height: 'auto',
  margin: '16px 0px',
  borderRadius: '8px',
  aspectRatio: '16:9'
};

export const Video = (props: VideoProps) => {
  const finalProps = { ...defaultProps, ...props };
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled
  }));
  
  const {
    connectors: { connect, drag }
  } = useNode();

  const {
    videoId,
    width,
    height,
    margin,
    borderRadius,
    aspectRatio
  } = finalProps;

  // Calculate aspect ratio padding
  const aspectRatios = {
    '16:9': '56.25%',
    '4:3': '75%',
    '1:1': '100%'
  };

  const paddingBottom = aspectRatios[aspectRatio] || aspectRatios['16:9'];

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      style={{
        width,
        margin,
        borderRadius,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <div
        style={{
          position: 'relative',
          paddingBottom,
          height: 0,
          overflow: 'hidden'
        }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius,
            pointerEvents: enabled ? 'none' : 'auto'
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video"
        />
      </div>
    </div>
  );
};

Video.craft = {
  displayName: 'Video',
  props: defaultProps,
  rules: {
    canDrag: () => true,
    canDrop: () => false,
    canMoveIn: () => false,
    canMoveOut: () => true
  }
};