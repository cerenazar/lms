import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { signToken } from '../lib/jwt.js';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

interface Task {
  id: string;
  kind: string;
  title: string;
  dueAt: string;
  state: string;
  isOverdue: boolean;
  durationMinutes: number | null;
  eventType: string | null;
  course: { id: string; title: string } | null;
}

describe('GET /api/v1/users/me/upcoming-tasks', () => {
  let app: FastifyInstance;
  let courseId: string;
  let otherCourseId: string;
  let studentId: string;
  let otherStudentId: string;
  let token: string;
  let otherToken: string;

  const get = (url = '/api/v1/users/me/upcoming-tasks', t?: string) =>
    app.inject({ method: 'GET', url, headers: t ? { authorization: `Bearer ${t}` } : {} });
  const tasks = async (query = ''): Promise<Task[]> =>
    (await get(`/api/v1/users/me/upcoming-tasks${query}`, token)).json().tasks;
  const titles = async (query = '') => (await tasks(query)).map((t) => t.title);

  const at = (ms: number) => new Date(Date.now() + ms);
  const assignment = (over: Record<string, unknown> = {}) =>
    prisma.assignment.create({
      data: { courseId, title: 'Ödev', description: 'Açıklama', dueAt: at(DAY), status: 'PUBLISHED', ...over },
    });
  const exam = (over: Record<string, unknown> = {}) =>
    prisma.exam.create({ data: { courseId, title: 'Sınav', status: 'PUBLISHED', ...over } });
  const event = (over: Record<string, unknown> = {}) =>
    prisma.calendarEvent.create({ data: { title: 'Etkinlik', type: 'deadline', start: at(DAY), ...over } });

  beforeAll(async () => {
    app = await buildApp();
  });

  beforeEach(async () => {
    await prisma.calendarEvent.deleteMany();
    await prisma.exam.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.courseInstructor.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.lessonProgress.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();

    const student = await prisma.user.create({
      data: { email: 's@example.com', passwordHash: 'x', name: 'S', role: 'STUDENT' },
    });
    const other = await prisma.user.create({
      data: { email: 'o@example.com', passwordHash: 'x', name: 'O', role: 'STUDENT' },
    });
    studentId = student.id;
    otherStudentId = other.id;
    token = signToken({ userId: studentId, role: 'STUDENT', roles: ['STUDENT'] });
    otherToken = signToken({ userId: otherStudentId, role: 'STUDENT', roles: ['STUDENT'] });
    const base = { description: 'Açıklama', category: 'Test', level: 'Başlangıç', status: 'PUBLISHED' };
    courseId = (await prisma.course.create({ data: { title: 'Kurs', ...base } })).id;
    otherCourseId = (await prisma.course.create({ data: { title: 'Diğer', ...base } })).id;
    for (const userId of [studentId, otherStudentId]) {
      await prisma.enrollment.create({ data: { userId, courseId, method: 'OPEN' } });
    }
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('requires authentication', async () => {
    expect((await get()).statusCode).toBe(401);
  });

  it('validates days', async () => {
    for (const q of ['0', '31', 'abc', '1.5', '-1']) {
      const res = await get(`/api/v1/users/me/upcoming-tasks?days=${q}`, token);
      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('VALIDATION_ERROR');
    }
    const ok = await get('/api/v1/users/me/upcoming-tasks?days=30', token);
    expect(ok.statusCode).toBe(200);
    expect(ok.json().windowDays).toBe(30);
    expect((await get('/api/v1/users/me/upcoming-tasks', token)).json().windowDays).toBe(7);
  });

  it('hides everything from unenrolled courses', async () => {
    await assignment({ courseId: otherCourseId });
    await exam({ courseId: otherCourseId, endsAt: at(DAY) });
    await event({ courseId: otherCourseId });
    expect(await tasks()).toEqual([]);
  });

  it('hides draft assignments and exams', async () => {
    await assignment({ status: 'DRAFT' });
    await exam({ status: 'DRAFT', endsAt: at(DAY) });
    expect(await tasks()).toEqual([]);
  });

  it('handles submitted, overdue and out-of-window assignments', async () => {
    const submitted = await assignment({ title: 'Teslim' });
    await prisma.assignmentSubmission.create({ data: { assignmentId: submitted.id, userId: studentId, text: 'x' } });
    await assignment({ title: 'Geciken', dueAt: at(-2 * DAY) });
    await assignment({ title: 'Çok eski', dueAt: at(-8 * DAY) });
    await assignment({ title: 'Uzak', dueAt: at(10 * DAY) });
    await assignment({ title: 'Yakın', dueAt: at(2 * DAY) });
    const list = await tasks();
    expect(list.map((t) => t.title)).toEqual(['Geciken', 'Yakın']);
    expect(list[0]).toMatchObject({
      kind: 'assignment',
      state: 'NOT_SUBMITTED',
      isOverdue: true,
      eventType: null,
      durationMinutes: null,
      course: { id: courseId, title: 'Kurs' },
    });
    expect(list[1].isOverdue).toBe(false);
    expect(list[1].id).toMatch(/^assignment:/);
    expect(await titles('?days=30')).toContain('Uzak');
    // Başka öğrencinin teslimi bu öğrenciyi etkilemez.
    expect((await get('/api/v1/users/me/upcoming-tasks', otherToken)).json().tasks.map((t: Task) => t.title)).toContain(
      'Teslim',
    );
  });

  it('uses startsAt for UPCOMING and endsAt for OPEN exams; skips closed and undated', async () => {
    const upcomingStart = at(2 * DAY);
    const openEnd = at(3 * DAY);
    await exam({ title: 'Yaklaşan', startsAt: upcomingStart, durationMinutes: 45 });
    await exam({ title: 'Açık', startsAt: at(-HOUR), endsAt: openEnd });
    await exam({ title: 'Kapanmış', startsAt: at(-3 * HOUR), endsAt: at(-HOUR) });
    await exam({ title: 'Tarihsiz' });
    await exam({ title: 'Süresiz açık', startsAt: at(-HOUR) });
    await exam({ title: 'Uzak', startsAt: at(20 * DAY) });
    const list = await tasks();
    expect(list.map((t) => [t.title, t.state, t.dueAt])).toEqual([
      ['Yaklaşan', 'UPCOMING', upcomingStart.toISOString()],
      ['Açık', 'OPEN', openEnd.toISOString()],
    ]);
    expect(list[0]).toMatchObject({ kind: 'exam', durationMinutes: 45, isOverdue: false });
  });

  it('shows SELECTED exams only to candidates', async () => {
    const e = await exam({ title: 'Seçili', audience: 'SELECTED', endsAt: at(DAY) });
    await prisma.examCandidate.create({ data: { examId: e.id, userId: otherStudentId } });
    expect(await titles()).toEqual([]);
    const res = await get('/api/v1/users/me/upcoming-tasks', otherToken);
    expect(res.json().tasks.map((t: Task) => t.title)).toEqual(['Seçili']);
  });

  it('includes only exam/deadline/lab calendar events, including general ones', async () => {
    await event({ title: 'Ders', type: 'lecture' });
    await event({ title: 'Tatil', type: 'holiday' });
    await event({ title: 'Genel', type: 'deadline', courseId: null });
    await event({ title: 'Lab', type: 'lab', courseId });
    await event({ title: 'Geçmiş', type: 'exam', start: at(-HOUR) });
    await event({ title: 'Uzak', type: 'exam', start: at(9 * DAY) });
    const list = await tasks();
    expect(list.map((t) => t.title)).toEqual(['Genel', 'Lab']);
    expect(list[0]).toMatchObject({ kind: 'event', eventType: 'deadline', course: null, state: 'UPCOMING' });
    expect(list[1].course).toEqual({ id: courseId, title: 'Kurs' });
  });

  it('truncates long descriptions to 140 characters', async () => {
    await assignment({ description: 'a'.repeat(300) });
    const [task] = (await get('/api/v1/users/me/upcoming-tasks', token)).json().tasks as (Task & {
      description: string;
    })[];
    expect(task.description.length).toBeLessThanOrEqual(140);
  });

  it('sorts by dueAt ascending and caps at 20', async () => {
    for (let i = 0; i < 25; i++) {
      await assignment({ title: `Ödev ${i}`, dueAt: at((25 - i) * HOUR) });
    }
    const list = await tasks();
    expect(list).toHaveLength(20);
    const times = list.map((t) => Date.parse(t.dueAt));
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(list[0].title).toBe('Ödev 24');
    const body = (await get('/api/v1/users/me/upcoming-tasks', token)).json();
    expect(typeof body.serverTime).toBe('string');
    expect(new Set(list.map((t) => t.id)).size).toBe(20);
  });
});
