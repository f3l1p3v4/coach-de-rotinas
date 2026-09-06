import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import TodoCheckbox from './components/TodoCheckbox';
import TodoTask from './components/TodoTask';
import TodoActions from './components/TodoActions';
import CustomTimerModal from './components/CustomTimerModal';

import './styles.css';

function TodoItem({ task, onToggle, onRemove, onStartTimer, onPauseResume, onCancel, activeTimer, currentTimeDisplay, onOpenDetails }) {
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
      <li 
        className={`todo-item-container ${task.timelineInfo?.isLast ? 'period-end' : ''}`} 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners}
      >
        <div className="todo-item">
          <div className="task-wrapper">
            <TodoCheckbox completed={task.completed} onToggle={() => onToggle(task.id)} />
            <TodoTask task={task} onOpenDetails={onOpenDetails} />
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
        </div>

        {task.timelineInfo && (
          <div className="timeline-block">
            <div className="timeline-time">{task.timelineInfo.time}</div>
            <div className="timeline-horizontal-line"></div>
            <div className={`timeline-vertical-line ${task.timelineInfo.isFirst ? 'top-rounded' : ''} ${task.timelineInfo.isLast ? 'bottom-rounded' : ''}`}></div>
            {task.timelineInfo.showText && (
              <div 
                className="timeline-period-text"
                style={{
                  top: `calc(${task.timelineInfo.groupSize / 2} * 100% + ${(task.timelineInfo.groupSize - 1) / 2} * 0.75rem)`
                }}
              >
                {task.timelineInfo.period}
              </div>
            )}
          </div>
        )}
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