import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import TodoCheckbox from './components/TodoCheckbox';
import TodoTask from './components/TodoTask';
import TodoActions from './components/TodoActions';
import CustomTimerModal from './components/CustomTimerModal';

import './styles.css';

function TodoItem({ task, onToggle, onRemove, onStartTimer, onPauseResume, onCancel, activeTimer, currentTimeDisplay }) {
  const [isCustomTimeModalOpen, setIsCustomTimeModalOpen] = useState(false);
  
  const isThisTaskActive = activeTimer.taskId === task.id;

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
    
  const handleStartCustom = (config, type) => {
    onStartTimer(task.id, config, type);
    setIsCustomTimeModalOpen(false);
  };

  return (
    <>
      <li className="todo-item" ref={setNodeRef} style={style}>
        <div className="task-wrapper" {...attributes} {...listeners}>
          <TodoCheckbox completed={task.completed} onToggle={() => onToggle(task.id)} />
          <TodoTask task={task} />
        </div>
        
        <span className="timer-display">
          {isThisTaskActive ? currentTimeDisplay : ''}
        </span>
        
        <TodoActions 
          task={task}
          activeTimer={activeTimer}
          onStartTimer={onStartTimer}
          onPauseResume={onPauseResume}
          onCancel={onCancel}
          onRemove={onRemove}
          openCustomModal={() => setIsCustomTimeModalOpen(true)}
        />
      </li>

      {isCustomTimeModalOpen && (
        <CustomTimerModal 
          closeModal={() => setIsCustomTimeModalOpen(false)}
          onStartCustom={handleStartCustom}
        />
      )}
    </>
  );
}

export default TodoItem;