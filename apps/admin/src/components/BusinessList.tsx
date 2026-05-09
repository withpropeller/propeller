import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Business } from '../api/client.js';

interface BusinessListProps {
  businesses: Business[];
  isLoading: boolean;
}

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  active: '#10b981',
  suspended: '#ef4444',
  closed: '#6b7280',
};

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

export function BusinessList({ businesses, isLoading }: BusinessListProps) {
  const [statusFilter, setStatusFilter] = useState('');
  const [kybFilter, setKybFilter] = useState('');

  const filtered = businesses.filter((b) => {
    if (statusFilter && b.status !== statusFilter) return false;
    if (kybFilter && b.kybStatus !== kybFilter) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', color: '#6b7280' }}>
        Loading businesses…
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          alignItems: 'center',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
          Businesses
        </h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '0.375rem 0.75rem',
            borderRadius: '0.375rem',
            border: '1px solid #e5e7eb',
            fontSize: '0.875rem',
          }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={kybFilter}
          onChange={(e) => setKybFilter(e.target.value)}
          style={{
            padding: '0.375rem 0.75rem',
            borderRadius: '0.375rem',
            border: '1px solid #e5e7eb',
            fontSize: '0.875rem',
          }}
        >
          <option value="">All KYB statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="under-review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="manual-review">Manual Review</option>
        </select>
        <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: 'auto' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

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
                Country
              </th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 500, color: '#374151' }}>
                Status
              </th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 500, color: '#374151' }}>
                KYB Status
              </th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 500, color: '#374151' }}>
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((business) => (
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
                <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>
                  {business.country}
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
                      background: `${statusColors[business.status] || '#6b7280'}15`,
                      color: statusColors[business.status] || '#6b7280',
                    }}
                  >
                    {business.status}
                  </span>
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
                <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.8125rem' }}>
                  {new Date(business.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
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
                  No businesses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
