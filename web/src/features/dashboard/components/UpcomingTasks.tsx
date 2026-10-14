import { Link } from 'react-router-dom';
import { Badge, Button, Icon, Panel, Text } from '../../../components';
import type { UpcomingTask } from '../../../types';
import styles from './UpcomingTasks.module.css';

interface UpcomingTasksProps {
  tasks: UpcomingTask[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const ALL_TASKS_PATH = '/notlar-ve-gorevler';
const SKELETON_ROWS = [0, 1, 2];

/** Teslim tarihi yaklaşan ödev ve sınavlar — FR-12. */
export function UpcomingTasks({ tasks, loading = false, error = null, onRetry }: UpcomingTasksProps) {
  const showList = !loading && !error && tasks.length > 0;

  return (
    <Panel
      title="Yaklaşan Görevler"
      icon="pending_actions"
      iconTone="warning"
      action={
        showList ? (
          <Badge tone="warning" variant="soft">
            {tasks.length} Görev
          </Badge>
        ) : undefined
      }
    >
      {loading ? (
        <ul className={styles.list} aria-busy="true" aria-label="Yaklaşan görevler yükleniyor">
          {SKELETON_ROWS.map((row) => (
            <li key={row} className={`${styles.item} ${styles.skeleton}`} aria-hidden="true">
              <span className={styles.skeletonLine} />
              <span className={styles.skeletonLine} />
              <span className={styles.skeletonLineShort} />
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && error ? (
        <div className={styles.state} role="alert">
          <Text role="body-md" tone="error">
            {error}
          </Text>
          {onRetry ? (
            <Button variant="ghost" size="sm" onClick={onRetry}>
              Tekrar dene
            </Button>
          ) : null}
        </div>
      ) : null}

      {!loading && !error && tasks.length === 0 ? (
        <div className={styles.state}>
          <Text role="body-md" tone="muted">
            Önümüzdeki 7 günde yaklaşan görevin yok.
          </Text>
          <Link to={ALL_TASKS_PATH} className={styles.action}>
            <Text role="label-md" tone="inherit">
              Tüm görevler
            </Text>
            <Icon name="arrow_forward" size="sm" />
          </Link>
        </div>
      ) : null}

      {showList ? (
        <ul className={styles.list}>
          {tasks.map((task) => (
            <li key={task.id} className={`${styles.item} ${task.isOverdue ? styles.overdue : ''}`}>
              <div className={styles.itemHeader}>
                <Badge tone={task.tagTone} variant="soft" shape="rounded" icon={task.tagIcon}>
                  {task.tagLabel}
                </Badge>
                <Text role="label-md" tone="muted">
                  {task.dueLabel}
                </Text>
              </div>

              <div className={styles.itemBody}>
                <Text role="label-lg" as="h3" tone="main">
                  {task.title}
                </Text>
                <Text role="body-sm" as="p" tone="muted">
                  {task.description}
                </Text>
              </div>

              <div className={styles.itemFooter}>
                <span className={styles.meta}>
                  <Icon name={task.metaIcon} size="sm" />
                  <Text role="body-sm" tone="muted">
                    {task.metaLabel}
                  </Text>
                  {task.durationLabel ? (
                    <Text role="body-sm" tone="muted">
                      {task.durationLabel}
                    </Text>
                  ) : null}
                </span>

                <Link to={task.href} className={styles.action} aria-label={`${task.actionLabel}: ${task.title}`}>
                  <Text role="label-md" tone="inherit">
                    {task.actionLabel}
                  </Text>
                  <Icon name="arrow_forward" size="sm" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {showList ? (
        <Link to={ALL_TASKS_PATH} className={`${styles.action} ${styles.allLink}`}>
          <Text role="label-md" tone="inherit">
            Tüm görevleri gör
          </Text>
          <Icon name="arrow_forward" size="sm" />
        </Link>
      ) : null}
    </Panel>
  );
}
