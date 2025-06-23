import { create } from 'zustand';
import { nanoid } from 'nanoid';

export interface Widget {
  id: string;
  type: 'heading' | 'text' | 'image' | 'button' | 'container' | 'spacer' | 'video';
  content: any;
  style: any;
}

export interface Column {
  id: string;
  type: 'column';
  width: number; // percentage 0-100
  widgets: Widget[];
  minHeight: string;
}

export interface Block {
  id: string;
  type: 'block';
  columns: Column[];
  style: {
    backgroundColor: string;
    padding: string;
    margin: string;
  };
}

export interface PageData {
  id: string;
  blocks: Block[];
  selectedElement: {
    type: 'block' | 'column' | 'widget' | null;
    id: string | null;
  };
}

interface EditorState {
  // Page structure
  currentPage: PageData;
  
  // UI state
  isResizing: boolean;
  resizingColumnId: string | null;
  hoveredElement: {
    type: 'block' | 'column' | 'widget' | null;
    id: string | null;
  };
  
  // Actions
  initializeDefaultPage: () => void;
  addBlock: (afterBlockId?: string) => void;
  addColumn: (blockId: string) => void;
  selectElement: (type: 'block' | 'column' | 'widget' | null, id: string | null) => void;
  deselectAll: () => void;
  setHoveredElement: (type: 'block' | 'column' | 'widget' | null, id: string | null) => void;
  updateColumnWidth: (columnId: string, width: number) => void;
  startResize: (columnId: string) => void;
  stopResize: () => void;
  removeColumn: (blockId: string, columnId: string) => void;
  removeBlock: (blockId: string) => void;
}

export const useEditor2Store = create<EditorState>((set, get) => ({
  currentPage: {
    id: 'page-1',
    blocks: [],
    selectedElement: {
      type: null,
      id: null,
    },
  },
  
  isResizing: false,
  resizingColumnId: null,
  hoveredElement: {
    type: null,
    id: null,
  },
  
  initializeDefaultPage: () => {
    const state = get();
    if (state.currentPage.blocks.length === 0) {
      const defaultBlock: Block = {
        id: `block-${nanoid()}`,
        type: 'block',
        columns: [
          {
            id: `column-${nanoid()}`,
            type: 'column',
            width: 100,
            widgets: [],
            minHeight: '200px',
          },
        ],
        style: {
          backgroundColor: '#ffffff',
          padding: '2rem',
          margin: '0',
        },
      };
      
      set({
        currentPage: {
          ...state.currentPage,
          blocks: [defaultBlock],
          selectedElement: {
            type: 'column',
            id: defaultBlock.columns[0].id,
          },
        },
      });
    }
  },
  
  addBlock: (afterBlockId?: string) => {
    const state = get();
    const newBlock: Block = {
      id: `block-${nanoid()}`,
      type: 'block',
      columns: [
        {
          id: `column-${nanoid()}`,
          type: 'column',
          width: 100,
          widgets: [],
          minHeight: '200px',
        },
      ],
      style: {
        backgroundColor: '#ffffff',
        padding: '2rem',
        margin: '0',
      },
    };
    
    let newBlocks = [...state.currentPage.blocks];
    
    if (afterBlockId) {
      const index = newBlocks.findIndex(block => block.id === afterBlockId);
      if (index !== -1) {
        newBlocks.splice(index + 1, 0, newBlock);
      } else {
        newBlocks.push(newBlock);
      }
    } else {
      newBlocks.push(newBlock);
    }
    
    set({
      currentPage: {
        ...state.currentPage,
        blocks: newBlocks,
        selectedElement: {
          type: 'column',
          id: newBlock.columns[0].id,
        },
      },
    });
  },
  
  addColumn: (blockId: string) => {
    const state = get();
    const newColumn: Column = {
      id: `column-${nanoid()}`,
      type: 'column',
      width: 50, // Default to 50% when adding new column
      widgets: [],
      minHeight: '200px',
    };
    
    const updatedBlocks = state.currentPage.blocks.map(block => {
      if (block.id === blockId) {
        // Distribute width evenly among all columns
        const totalColumns = block.columns.length + 1;
        const newWidth = Math.floor(100 / totalColumns);
        const remainder = 100 - (newWidth * totalColumns);
        
        const updatedColumns = block.columns.map((col, index) => ({
          ...col,
          width: index === 0 ? newWidth + remainder : newWidth,
        }));
        
        return {
          ...block,
          columns: [...updatedColumns, { ...newColumn, width: newWidth }],
        };
      }
      return block;
    });
    
    set({
      currentPage: {
        ...state.currentPage,
        blocks: updatedBlocks,
        selectedElement: {
          type: 'column',
          id: newColumn.id,
        },
      },
    });
  },
  
  selectElement: (type, id) => {
    set(state => ({
      currentPage: {
        ...state.currentPage,
        selectedElement: { type, id },
      },
    }));
  },
  
  deselectAll: () => {
    set(state => ({
      currentPage: {
        ...state.currentPage,
        selectedElement: { type: null, id: null },
      },
    }));
  },
  
  setHoveredElement: (type, id) => {
    set({ hoveredElement: { type, id } });
  },
  
  updateColumnWidth: (columnId: string, width: number) => {
    const state = get();
    const updatedBlocks = state.currentPage.blocks.map(block => ({
      ...block,
      columns: block.columns.map(col => 
        col.id === columnId ? { ...col, width } : col
      ),
    }));
    
    set({
      currentPage: {
        ...state.currentPage,
        blocks: updatedBlocks,
      },
    });
  },
  
  startResize: (columnId: string) => {
    set({ isResizing: true, resizingColumnId: columnId });
  },
  
  stopResize: () => {
    set({ isResizing: false, resizingColumnId: null });
  },
  
  removeColumn: (blockId: string, columnId: string) => {
    const state = get();
    const updatedBlocks = state.currentPage.blocks.map(block => {
      if (block.id === blockId) {
        const updatedColumns = block.columns.filter(col => col.id !== columnId);
        
        // Redistribute width evenly among remaining columns
        if (updatedColumns.length > 0) {
          const newWidth = Math.floor(100 / updatedColumns.length);
          const remainder = 100 - (newWidth * updatedColumns.length);
          
          return {
            ...block,
            columns: updatedColumns.map((col, index) => ({
              ...col,
              width: index === 0 ? newWidth + remainder : newWidth,
            })),
          };
        }
        
        return { ...block, columns: updatedColumns };
      }
      return block;
    });
    
    set({
      currentPage: {
        ...state.currentPage,
        blocks: updatedBlocks,
        selectedElement: { type: null, id: null },
      },
    });
  },
  
  removeBlock: (blockId: string) => {
    const state = get();
    const updatedBlocks = state.currentPage.blocks.filter(block => block.id !== blockId);
    
    set({
      currentPage: {
        ...state.currentPage,
        blocks: updatedBlocks,
        selectedElement: { type: null, id: null },
      },
    });
  },
}));