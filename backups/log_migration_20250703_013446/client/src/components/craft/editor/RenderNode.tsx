import { useNode, useEditor } from '@craftjs/core';
import { ROOT_NODE } from '@craftjs/utils';
import * as React from 'react';
import ReactDOM from 'react-dom';
import { styled } from 'styled-components';

import { ArrowUp, Trash2, Move } from 'lucide-react';

const IndicatorDiv = styled.div`
  height: 30px;
  margin-top: -29px;
  font-size: 12px;
  line-height: 12px;

  svg {
    fill: #fff;
    width: 15px;
    height: 15px;
  }
`;

const Btn = styled.a`
  padding: 0 0px;
  opacity: 0.9;
  display: flex;
  align-items: center;
  > div {
    position: relative;
    top: -50%;
    left: -50%;
  }
`;

export const RenderNode = ({ render }: { render: React.ReactNode }) => {
  const { id } = useNode();
  const { actions, query, isActive } = useEditor((_, query) => ({
    isActive: query.getEvent('selected').contains(id),
  }));

  const {
    isHover,
    dom,
    name,
    moveable,
    deletable,
    connectors: { drag },
    parent,
  } = useNode((node) => ({
    isHover: node.events.hovered,
    dom: node.dom,
    name: node.data.custom.displayName || node.data.displayName,
    moveable: query.node(node.id).isDraggable(),
    deletable: query.node(node.id).isDeletable(),
    parent: node.data.parent,
    props: node.data.props,
  }));

  const currentRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (dom) {
      if (isActive || isHover) dom.classList.add('component-selected');
      else dom.classList.remove('component-selected');
    }
  }, [dom, isActive, isHover]);

  const getPos = React.useCallback((dom: HTMLElement) => {
    if (!dom || !dom.getBoundingClientRect) {
      return { top: '0px', left: '0px' };
    }
    
    try {
      const { top, left, bottom } = dom.getBoundingClientRect();
      return {
        top: `${top > 0 ? top : bottom}px`,
        left: `${left}px`,
      };
    } catch (error) {
      console.warn('Error getting bounding rect:', error);
      return { top: '0px', left: '0px' };
    }
  }, []);

  const scroll = React.useCallback(() => {
    const { current: currentDOM } = currentRef;

    if (!currentDOM || !dom) {
      return;
    }

    try {
      if (dom) {
        const { top, left } = getPos(dom);
        currentDOM.style.top = top;
        currentDOM.style.left = left;
      }
    } catch (error) {
      console.warn('Error in scroll positioning:', error);
    }
  }, [dom, getPos]);

  React.useEffect(() => {
    const renderer = document.querySelector('.craftjs-renderer');
    if (renderer) {
      renderer.addEventListener('scroll', scroll);
    }

    return () => {
      const renderer = document.querySelector('.craftjs-renderer');
      if (renderer) {
        renderer.removeEventListener('scroll', scroll);
      }
    };
  }, [scroll]);

  return (
    <>
      {isHover || isActive
        ? ReactDOM.createPortal(
            <IndicatorDiv
              ref={currentRef}
              className="px-2 py-2 text-white bg-primary fixed flex items-center"
              style={{
                left: dom ? getPos(dom).left : 0,
                top: dom ? getPos(dom).top : 0,
                zIndex: 9999,
              }}
            >
              <h2 className="flex-1 mr-4">{name}</h2>
              {moveable ? (
                <Btn
                  className="mr-2 cursor-move"
                  ref={(dom) => {
                    if (dom) drag(dom);
                  }}
                >
                  <Move size={16} />
                </Btn>
              ) : null}
              {id !== ROOT_NODE && (
                <Btn
                  className="mr-2 cursor-pointer"
                  onClick={() => {
                    if (parent) actions.selectNode(parent);
                  }}
                >
                  <ArrowUp size={16} />
                </Btn>
              )}
              {deletable ? (
                <Btn
                  className="cursor-pointer"
                  onMouseDown={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    actions.delete(id);
                  }}
                >
                  <Trash2 size={16} />
                </Btn>
              ) : null}
            </IndicatorDiv>,
            document.querySelector('.page-container') || document.body
          )
        : null}
      {render}
    </>
  );
};
