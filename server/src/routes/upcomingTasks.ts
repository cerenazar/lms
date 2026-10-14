import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/rbac.js';
import { AppError } from '../errors.js';
import { collectUpcomingTasks } from '../lib/upcomingTasks.js';

const DEFAULT_DAYS = 7;
const MAX_DAYS = 30;

function parseDays(raw: unknown): number {
  if (raw === undefined) return DEFAULT_DAYS;
  const days = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
    throw new AppError('VALIDATION_ERROR', `days 1 ile ${MAX_DAYS} arasında bir tam sayı olmalıdır.`, 400);
  }
  return days;
}

export function registerUpcomingTaskRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { days?: string } }>(
    '/api/v1/users/me/upcoming-tasks',
    { preHandler: [requireAuth] },
    async (request) => {
      const days = parseDays(request.query.days);
      const now = new Date();
      const tasks = await collectUpcomingTasks(request.user!.userId, now, days);
      return { tasks, windowDays: days, serverTime: now.toISOString() };
    },
  );
}
