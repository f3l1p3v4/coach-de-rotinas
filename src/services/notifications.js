import { toast as sonner } from 'sonner';
import { workspaceStore } from './workspaceStore';

// State setters may persist in effects. Wait for the render/effects before claiming success.
const afterRender = () => new Promise(resolve => {
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => requestAnimationFrame(resolve));
  else setTimeout(resolve, 0);
});
export const toast = {
  ...sonner,
  async success(message, options) {
    await afterRender();
    const state = workspaceStore.getSnapshot();
    if (!state.ready) return undefined; // Authentication has its own notifications.
    try { await workspaceStore.flush(); return sonner.success(message, options); }
    catch { return undefined; } // CloudGate presents the persistent error and recovery actions.
  }
};
