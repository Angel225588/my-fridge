import type { ExpirationStatus } from '@/types';

const statusStyles: Record<ExpirationStatus, string> = {
  fresh: 'bg-fresh-bg text-fresh border-fresh/20',
  warning: 'bg-warning-bg text-warning-color border-warning-color/20',
  urgent: 'bg-urgent-bg text-urgent border-urgent/20',
  expired: 'bg-expired-bg text-expired border-expired/20',
  'no-date': 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
};

interface BadgeProps {
  status: ExpirationStatus;
  label: string;
}

export default function Badge({ status, label }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${statusStyles[status]}`}
    >
      {status === 'expired' && '!! '}
      {status === 'urgent' && '! '}
      {status === 'no-date' && '! '}
      {label}
    </span>
  );
}
