import { updateGoogleEvent } from './googleCalendarService';

jest.mock('../lib/supabaseClient', () => ({ supabase: null, isSupabaseConfigured: false }));
const response = (data, ok = true, status = 200) => ({ ok, status, json: async () => data });

beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => jest.restoreAllMocks());

test('moves all-day events preserving the exclusive end date and multi-day duration', async () => {
  fetch.mockResolvedValueOnce(response({ start: { date: '2026-10-17' }, end: { date: '2026-10-19' } }))
    .mockResolvedValueOnce(response({ id: 'event' }));
  await updateGoogleEvent('token', 'event', { text: 'Reunião', date: '2026-10-20' });
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({
    summary: 'Reunião', description: '', start: { date: '2026-10-20' }, end: { date: '2026-10-22' }
  });
  expect(fetch.mock.calls[1][1].method).toBe('PATCH');
});

test('preserves local start time and duration for timed events', async () => {
  const start = new Date(2026, 9, 17, 23, 30);
  fetch.mockResolvedValueOnce(response({ start: { dateTime: start.toISOString() }, end: { dateTime: new Date(+start + 7200000).toISOString() } }))
    .mockResolvedValueOnce(response({ id: 'event' }));
  await updateGoogleEvent('token', 'event', { text: 'Reunião', date: '2026-10-20' });
  const body = JSON.parse(fetch.mock.calls[1][1].body);
  const moved = new Date(body.start.dateTime);
  expect(moved.getDate()).toBe(20);
  expect(moved.getHours()).toBe(23);
  expect(new Date(body.end.dateTime) - moved).toBe(7200000);
});

test('reports Google errors instead of confirming a failed save', async () => {
  fetch.mockResolvedValueOnce(response({ error: { message: 'Sem permissão' } }, false, 403));
  await expect(updateGoogleEvent('token', 'event', { date: '2026-10-20' })).rejects.toThrow('Sem permissão');
  expect(fetch).toHaveBeenCalledTimes(1);
});
