import { Link } from 'react-router-dom';
import type { Business } from '../api/client.js';

interface KybQueueProps {
  businesses: Business[];
  isLoading: boolean;
}

const kybStatusColors: Record<string, string> = {
  draft: '#9ca3af',
  'files-uploading': '#fbbf24',
  submitted: '#60a5fa',
  'identity-pending': '#a78bfa',
  'under-review': '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  'manual-review': '#ec4899',
};

function needsAction(kybStatus: string): boolean {
  return ['under-review', 'manual-review', 'submitted', 'identity-pending'].includes(kybStatus);
}

export function KybQueue({ businesses, isLoading }: KybQueueProps) {
  const queue = businesses
    .filter((b) => needsAction(b.kybStatus))
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  const pending = queue.filter((b) => ['submitted', 'identity-pending'].includes(b.kybStatus));
  const review = queue.filter((b) => ['under-review', 'manual-review'].includes(b.kybStatus));

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', color: '#6b7280' }}>
        Loading KYB queue…
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <StatCard label="Pending" value={pending.length} color="#60a5fa" />
        <StatCard label="Needs Review" value={review.length} color="#ec4899" />
        <StatCard label="Total Queue" value={queue.length} color="#6b7280" />
      </div>

      <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 600 }}>
        KYB Queue
      </h2>

      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 500, color: '#374151' }}>
                Name
              </th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 500, color: '#374151' }}>
                KYB Status
              </th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 500, color: '#374151' }}>
                PayKKa Merch ID
              </th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 500, color: '#374151' }}>
                Created
              </th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 500, color: '#374151' }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {queue.map((business) => (
              <tr
                key={business.id}
                style={{ borderBottom: '1px solid #f3f4f6' }}
              >
                <td style={{ padding: '0.75rem 1rem' }}>
                  <Link
                    to={`/businesses/${business.id}`}
                    style={{
                      color: '#111827',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.textDecoration = 'none';
                    }}
                  >
                    {business.name}
                  </Link>
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      background: `${kybStatusColors[business.kybStatus] || '#6b7280'}15`,
                      color: kybStatusColors[business.kybStatus] || '#6b7280',
                    }}
                  >
                    {business.kybStatus}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.8125rem', fontFamily: 'monospace' }}>
                  {business.paykkaMerchId || '—'}
                </td>
                <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.8125rem' }}>
                  {new Date(business.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                  <Link
                    to={`/businesses/${business.id}`}
                    style={{
                      display: 'inline-flex',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '0.375rem',
                      background: '#111827',
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      textDecoration: 'none',
                    }}
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
            {queue.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#9ca3af',
                    fontSize: '0.875rem',
                  }}
                >
                  No items in the KYB queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        flex: 1,
        padding: '1rem 1.25rem',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb',
        background: '#fff',
      }}
    >
      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 600, color }}>
        {value}
      </div>
    </div>
  );
}
