import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import TodoCheckbox from './components/TodoCheckbox';
import TodoTask from './components/TodoTask';
import TodoActions from './components/TodoActions';
import CustomTimerModal from './components/CustomTimerModal';
import { getDifficultyByColor } from '../../constants/difficulty';
import { getCategoryColor } from '../../constants/categories';

import './styles.css';

function TodoItem({ 
  task, 
  onToggle, 
  onRemove, 
  onStartTimer, 
  onPauseResume, 
  onCancel, 
  activeTimer, 
  currentTimeDisplay, 
  onOpenDetails,
  selectedDate,
  todayStr,
  onMoveToToday
}) {
  const [isCustomTimeModalOpen, setIsCustomTimeModalOpen] = useState(false);
  
  const isThisTaskActive = activeTimer.taskId === task.id;

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
    
  const handleStartCustom = (config, type) => {
    onStartTimer(task.id, config, type);
    setIsCustomTimeModalOpen(false);
  };

  const diffInfo = getDifficultyByColor(task.color || task.difficulty);
  const accentColor = diffInfo ? diffInfo.color : (task.color || getCategoryColor(task.category));

  return (
    <>
      <div 
        className="todo-item-container" 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners}
      >
        <div className="todo-item">
          {accentColor && (
            <div 
              className="category-accent-strip" 
              style={{ backgroundColor: accentColor }}
              title={`Dificuldade: ${diffInfo?.label || 'Padrão'}${task.category ? ` • Categoria: ${task.category}` : ''}`}
            />
          )}
          <div className="task-wrapper">
            <TodoCheckbox completed={task.completed} onToggle={() => onToggle(task.id)} />
            <TodoTask task={task} onOpenDetails={onOpenDetails} />
          </div>
          
          {isThisTaskActive && (
            <span className="timer-display">
              {currentTimeDisplay}
            </span>
          )}
          
          <TodoActions 
            task={task}
            activeTimer={activeTimer}
            onStartTimer={onStartTimer}
            onPauseResume={onPauseResume}
            onCancel={onCancel}
            onRemove={onRemove}
            openCustomModal={() => setIsCustomTimeModalOpen(true)}
            selectedDate={selectedDate}
            todayStr={todayStr}
            onMoveToToday={onMoveToToday}
          />
        </div>
      </div>

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