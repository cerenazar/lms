import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../lib/apiClient';
import type { UpcomingTask, UpcomingTasksResponse } from '../../types';
import { toUpcomingTask } from './upcomingTaskMeta';

const UPCOMING_DAYS = 7;

interface State {
  tasks: UpcomingTask[];
  loading: boolean;
  error: string | null;
}

/** GET /api/v1/users/me/upcoming-tasks?days=7 sonucunu panelin görünüm modeline çevirir. */
export function useUpcomingTasks() {
  const [state, setState] = useState<State>({ tasks: [], loading: true, error: null });

  const load = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    return apiFetch<UpcomingTasksResponse>(`/api/v1/users/me/upcoming-tasks?days=${UPCOMING_DAYS}`)
      .then((result) => {
        const now = new Date();
        setState({ tasks: result.tasks.map((item) => toUpcomingTask(item, now)), loading: false, error: null });
      })
      .catch(() => setState({ tasks: [], loading: false, error: 'Yaklaşan görevler yüklenemedi.' }));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}
