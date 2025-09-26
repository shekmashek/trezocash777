import React, { useState, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { X, GripVertical, Minimize2, Maximize2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { updateNote, deleteNote } from '../context/actions';

const StickyNote = ({ note, index, constraintsRef }) => {
  const { dataDispatch } = useData();
  const { uiState } = useUI();
  const { activeProjectId } = uiState;
  const dragControls = useDragControls();
  
  const [internalContent, setInternalContent] = useState(note.content);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (internalContent !== note.content) {
        updateNote({dataDispatch}, note.id, { content: internalContent });
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [internalContent, note.id, note.content, dataDispatch]);

  const handleContentChange = (e) => {
    setInternalContent(e.target.value);
  };

  const handleDragEnd = (event, info) => {
    if (!note.isMinimized) {
        updateNote({dataDispatch}, note.id, { x: info.point.x, y: info.point.y });
    }
  };

  const handleDelete = () => {
    deleteNote({dataDispatch}, { noteId: note.id, projectId: activeProjectId });
  };

  const handleToggleMinimize = () => {
    dataDispatch({ type: 'TOGGLE_NOTE_MINIMIZE', payload: note.id });
  };

  function startDrag(event) {
    dragControls.start(event, { snapToCursor: false });
  }

  const minimizedY = window.innerHeight - 80;
  const minimizedX = 20 + (index * 180);

  const variants = {
    maximized: {
      x: note.x,
      y: note.y,
      width: '16rem', // 256px
      height: '16rem', // 256px
      scale: 1,
      opacity: 1,
      transition: { type: 'spring', stiffness: 400, damping: 30 }
    },
    minimized: {
      x: minimizedX,
      y: minimizedY,
      width: '10rem', // 160px
      height: '2.5rem', // 40px
      scale: 1,
      opacity: 1,
      transition: { type: 'spring', stiffness: 400, damping: 30 }
    }
  };

  return (
    <motion.div
      drag={!note.isMinimized}
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={constraintsRef}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      variants={variants}
      animate={note.isMinimized ? 'minimized' : 'maximized'}
      initial={false}
      className={`fixed ${note.color} rounded-lg shadow-xl flex flex-col p-3 z-40 overflow-hidden`}
    >
      <div className="flex justify-between items-start mb-2 flex-shrink-0">
        {!note.isMinimized && (
            <div 
              className="drag-handle p-1 -ml-1 text-gray-500 opacity-50 cursor-move" 
              onPointerDown={startDrag}
            >
              <GripVertical size={16} />
            </div>
        )}
        {note.isMinimized && (
            <div className="font-semibold text-sm text-gray-700 truncate flex-grow pr-2">
                {note.content.substring(0, 20) || 'Note...'}
            </div>
        )}
        <div className="flex items-center">
            <button onClick={handleToggleMinimize} className="p-1 text-gray-600 hover:text-blue-600 hover:bg-black/10 rounded-full">
              {note.isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <button onClick={handleDelete} className="p-1 text-gray-600 hover:text-red-600 hover:bg-black/10 rounded-full">
              <X size={16} />
            </button>
        </div>
      </div>
      {!note.isMinimized && (
        <textarea
          value={internalContent}
          onChange={handleContentChange}
          className="w-full h-full bg-transparent resize-none focus:outline-none text-gray-800 text-sm placeholder-gray-600 cursor-text"
          placeholder="Écrivez quelque chose..."
        />
      )}
    </motion.div>
  );
};

export default StickyNote;
