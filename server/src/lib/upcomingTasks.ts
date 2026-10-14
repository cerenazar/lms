import { prisma } from './prisma.js';
import { examAvailability } from './exams.js';

export const UPCOMING_TASK_LIMIT = 20;
const DAY_MS = 86_400_000;
const OVERDUE_GRACE_DAYS = 7;
const DESCRIPTION_MAX = 140;
const EVENT_TYPES = ['exam', 'deadline', 'lab'];

export type UpcomingTaskKind = 'assignment' | 'exam' | 'event';
export type UpcomingTaskState = 'NOT_SUBMITTED' | 'OPEN' | 'UPCOMING';

export interface UpcomingTask {
  id: string;
  kind: UpcomingTaskKind;
  sourceId: string;
  title: string;
  description: string | null;
  course: { id: string; title: string } | null;
  dueAt: string;
  state: UpcomingTaskState;
  isOverdue: boolean;
  durationMinutes: number | null;
  eventType: string | null;
}

function shorten(text: string | null): string | null {
  const trimmed = text?.trim();
  if (!trimmed) return null;
  return trimmed.length <= DESCRIPTION_MAX ? trimmed : `${trimmed.slice(0, DESCRIPTION_MAX - 1).trimEnd()}…`;
}

/** Öğrencinin kayıtlı olduğu kurslardaki ödev, sınav ve takvim son tarihlerini `dueAt` artan sırada toplar. */
export async function collectUpcomingTasks(userId: string, now: Date, days: number): Promise<UpcomingTask[]> {
  const horizon = new Date(now.getTime() + days * DAY_MS);
  const overdueFloor = new Date(now.getTime() - OVERDUE_GRACE_DAYS * DAY_MS);
  const enrollments = await prisma.enrollment.findMany({ where: { userId }, select: { courseId: true } });
  const courseIds = enrollments.map((row) => row.courseId);
  const courseSelect = { select: { id: true, title: true } } as const;

  const [assignments, exams, events] = await Promise.all([
    prisma.assignment.findMany({
      where: {
        courseId: { in: courseIds },
        status: 'PUBLISHED',
        dueAt: { gte: overdueFloor, lte: horizon },
        submissions: { none: { userId } },
      },
      include: { course: courseSelect },
    }),
    prisma.exam.findMany({
      where: {
        courseId: { in: courseIds },
        status: 'PUBLISHED',
        OR: [{ audience: 'COURSE' }, { candidates: { some: { userId } } }],
      },
      include: { course: courseSelect },
    }),
    prisma.calendarEvent.findMany({
      where: {
        type: { in: EVENT_TYPES },
        OR: [{ courseId: null }, { courseId: { in: courseIds } }],
        start: { gte: now, lte: horizon },
      },
      include: { course: courseSelect },
    }),
  ]);

  const tasks: UpcomingTask[] = [];

  for (const a of assignments) {
    tasks.push({
      id: `assignment:${a.id}`,
      kind: 'assignment',
      sourceId: a.id,
      title: a.title,
      description: shorten(a.description),
      course: a.course,
      dueAt: a.dueAt.toISOString(),
      state: 'NOT_SUBMITTED',
      isOverdue: a.dueAt.getTime() < now.getTime(),
      durationMinutes: null,
      eventType: null,
    });
  }

  for (const exam of exams) {
    const availability = examAvailability(exam, now);
    if (availability === 'CLOSED') continue;
    const due = availability === 'OPEN' ? exam.endsAt : exam.startsAt;
    if (!due || due.getTime() > horizon.getTime()) continue;
    tasks.push({
      id: `exam:${exam.id}`,
      kind: 'exam',
      sourceId: exam.id,
      title: exam.title,
      description: shorten(exam.description),
      course: exam.course,
      dueAt: due.toISOString(),
      state: availability,
      isOverdue: false,
      durationMinutes: exam.durationMinutes,
      eventType: null,
    });
  }

  for (const event of events) {
    tasks.push({
      id: `event:${event.id}`,
      kind: 'event',
      sourceId: event.id,
      title: event.title,
      description: shorten(event.description),
      course: event.course,
      dueAt: event.start.toISOString(),
      state: 'UPCOMING',
      isOverdue: false,
      durationMinutes: null,
      eventType: event.type,
    });
  }

  tasks.sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.id.localeCompare(b.id));
  return tasks.slice(0, UPCOMING_TASK_LIMIT);
}
