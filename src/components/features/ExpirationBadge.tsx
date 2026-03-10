import Badge from '@/components/ui/Badge';
import { getExpirationInfo } from '@/lib/utils/expiration';

interface ExpirationBadgeProps {
  expirationDate: string | null;
}

export default function ExpirationBadge({ expirationDate }: ExpirationBadgeProps) {
  const info = getExpirationInfo(expirationDate);
  return <Badge status={info.status} label={info.label} />;
}
