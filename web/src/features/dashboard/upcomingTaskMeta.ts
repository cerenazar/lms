import type { BadgeTone } from '../../components';
import type { TaskKind, UpcomingTask, UpcomingTaskItem } from '../../types';

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
const URGENT_ASSIGNMENT_MS = 48 * HOUR_MS;
const TIME_ZONE = 'Europe/Istanbul';

// formatDateTime/formatRelative ("3 saat önce", "27 Ekim 2026 23:59") bu panelin
// "5 saat kaldı" / "27 Ekim 23:59" biçimlerini üretmediği için burada ayrı biçimleyiciler var.
const dueDateFormat = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: TIME_ZONE,
});
const weekdayTimeFormat = new Intl.DateTimeFormat('tr-TR', {
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: TIME_ZONE,
});

interface Tag {
  label: string;
  tone: BadgeTone;
  icon: string;
}

const EVENT_TAGS: Record<string, Tag> = {
  lab: { label: 'Laboratuvar', tone: 'cyan', icon: 'science' },
  exam: { label: 'Sınav', tone: 'brand', icon: 'event' },
  deadline: { label: 'Son Tarih', tone: 'warning', icon: 'flag' },
};

function pickTag(item: UpcomingTaskItem, remainingMs: number): Tag {
  if (item.isOverdue) return { label: 'Gecikti', tone: 'error', icon: 'warning' };
  if (item.kind === 'assignment') {
    return remainingMs < URGENT_ASSIGNMENT_MS
      ? { label: 'Yüksek Öncelik', tone: 'error', icon: 'priority_high' }
      : { label: 'Ödev', tone: 'info', icon: 'assignment' };
  }
  if (item.kind === 'exam') {
    return item.state === 'OPEN'
      ? { label: 'Sınav Açık', tone: 'success', icon: 'quiz' }
      : { label: 'Çevrim İçi Sınav', tone: 'brand', icon: 'quiz' };
  }
  return EVENT_TAGS[item.eventType ?? ''] ?? EVENT_TAGS.deadline;
}

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase('tr-TR') + text.slice(1);
}

/** Kalan/geçen süreyi tek birimle yazar: "45 dk", "5 saat", "2 gün". */
function span(ms: number): string {
  if (ms < HOUR_MS) return `${Math.max(1, Math.floor(ms / MINUTE_MS))} dk`;
  if (ms < DAY_MS) return `${Math.floor(ms / HOUR_MS)} saat`;
  return `${Math.floor(ms / DAY_MS)} gün`;
}

function dueLabel(item: UpcomingTaskItem, remainingMs: number, due: Date): string {
  if (item.isOverdue) return `${span(-remainingMs)} gecikti`;
  if (item.kind === 'exam' && item.state === 'UPCOMING') return capitalize(weekdayTimeFormat.format(due));
  return `${span(remainingMs)} kaldı`;
}

function actionFor(item: UpcomingTaskItem): { actionLabel: string; href: string } {
  if (item.kind === 'assignment') {
    return {
      actionLabel: 'Teslim Et',
      href: item.course ? `/kurslarim/${item.course.id}/odevler/${item.sourceId}` : '/kurslarim',
    };
  }
  if (item.kind === 'exam') return { actionLabel: 'Detaylar', href: '/sinavlar' };
  return { actionLabel: 'Takvimde Gör', href: '/takvim' };
}

/** API kaydını panelin görünüm modeline çevirir; `now` dışarıdan verildiği için sonuç belirleyicidir. */
export function toUpcomingTask(item: UpcomingTaskItem, now: Date): UpcomingTask {
  const due = new Date(item.dueAt);
  const remainingMs = due.getTime() - now.getTime();
  const tag = pickTag(item, remainingMs);
  const kind: TaskKind = item.kind === 'event' && item.eventType === 'lab' ? 'lab' : item.kind;

  return {
    id: item.id,
    kind,
    tagLabel: tag.label,
    tagTone: tag.tone,
    tagIcon: tag.icon,
    dueLabel: dueLabel(item, remainingMs, due),
    title: item.title,
    description: item.description ?? item.course?.title ?? '',
    metaIcon: 'schedule',
    metaLabel: dueDateFormat.format(due).replace(',', ''),
    durationLabel: item.durationMinutes ? `${item.durationMinutes} dakika` : undefined,
    ...actionFor(item),
    isOverdue: item.isOverdue || undefined,
  };
}
