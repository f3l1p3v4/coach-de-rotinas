export function rollOverPendingTasks(tasks, history = {}, now = new Date()) {
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  let changed = false;
  const updated = tasks.map(task => {
    const status = history[`${task.id}_${task.date}`]?.status || task.status;
    const overdue = !task.isRecurring && task.date && task.date < today;
    const pending = !task.completed && status !== 'completed' && status !== 'failed';
    const { emoji, ...cleanTask } = task;
    if (emoji !== undefined || (overdue && pending)) changed = true;
    return overdue && pending ? { ...cleanTask, date: today } : emoji !== undefined ? cleanTask : task;
  });
  return changed ? updated : tasks;
}
