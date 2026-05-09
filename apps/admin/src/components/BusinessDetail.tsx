import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Business } from '../api/client.js';

interface BusinessDetailProps {
  business: Business;
  onAction: (id: string, action: string, reason?: string) => void;
  isMutating: boolean;
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

export function BusinessDetail({ business, onAction, isMutating }: BusinessDetailProps) {
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [pendingAction, setPendingAction] = useState('');

  const handleAction = (action: string) => {
    if (action === 'rejected' || action === 'manual-review') {
      setPendingAction(action);
      setShowReasonInput(true);
      return;
    }
    onAction(business.id, action);
  };

  const handleConfirmWithReason = () => {
    onAction(business.id, pendingAction, reason || undefined);
    setShowReasonInput(false);
    setReason('');
    setPendingAction('');
  };

  const canApprove = ['under-review', 'manual-review'].includes(business.kybStatus);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: '#6b7280',
            fontSize: '0.875rem',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '0.5rem',
          }}
        >
          ← Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
            {business.name}
          </h1>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.125rem 0.625rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 500,
              background: `${kybStatusColors[business.kybStatus] || '#6b7280'}15`,
              color: kybStatusColors[business.kybStatus] || '#6b7280',
            }}
          >
            {business.kybStatus}
          </span>
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
          {business.country} · ID: {business.id}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <InfoCard title="Business Info">
          <InfoRow label="Status" value={business.status} color={statusColors[business.status]} />
          <InfoRow label="KYB Status" value={business.kybStatus} color={kybStatusColors[business.kybStatus]} />
          <InfoRow label="PayKKa Merch ID" value={business.paykkaMerchId || '—'} mono />
          <InfoRow label="Created" value={new Date(business.createdAt).toLocaleString()} />
        </InfoCard>

        <InfoCard title="Actions">
          {canApprove && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <ActionButton
                label="Approve"
                color="#10b981"
                onClick={() => handleAction('approved')}
                disabled={isMutating}
              />
              <ActionButton
                label="Reject"
                color="#ef4444"
                onClick={() => handleAction('rejected')}
                disabled={isMutating}
              />
              <ActionButton
                label="Request More Info"
                color="#f59e0b"
                onClick={() => handleAction('manual-review')}
                disabled={isMutating}
              />
            </div>
          )}
          {!canApprove && (
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
              No actions available for this KYB status.
            </p>
          )}

          {showReasonInput && (
            <div style={{ marginTop: '0.75rem' }}>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason…"
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  onClick={handleConfirmWithReason}
                  disabled={isMutating}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.375rem',
                    background: '#111827',
                    color: '#fff',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    opacity: isMutating ? 0.6 : 1,
                  }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => {
                    setShowReasonInput(false);
                    setReason('');
                    setPendingAction('');
                  }}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.375rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </InfoCard>
      </div>

      {business.paykkaRawResponse && (
        <div style={{ marginBottom: '1.5rem' }}>
          <InfoCard title="PayKKa Raw Response">
            <pre
              style={{
                margin: 0,
                padding: '0.75rem',
                background: '#f9fafb',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                overflow: 'auto',
                maxHeight: '24rem',
              }}
            >
              {JSON.stringify(business.paykkaRawResponse, null, 2)}
            </pre>
          </InfoCard>
        </div>
      )}

      {business.sanctionsHits && business.sanctionsHits.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <InfoCard title={`ComplyAdvantage Hits (${business.sanctionsHits.length})`}>
            {business.sanctionsHits.map((hit, i) => (
              <pre
                key={i}
                style={{
                  margin: '0 0 0.5rem',
                  padding: '0.5rem',
                  background: '#fef2f2',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  overflow: 'auto',
                }}
              >
                {JSON.stringify(hit, null, 2)}
              </pre>
            ))}
          </InfoCard>
        </div>
      )}

      {business.auditTimeline && business.auditTimeline.length > 0 && (
        <div>
          <InfoCard title="Audit Timeline">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {business.auditTimeline.map((event, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid #f3f4f6',
                  }}
                >
                  <div
                    style={{
                      width: '0.5rem',
                      height: '0.5rem',
                      borderRadius: '50%',
                      background: '#6b7280',
                      marginTop: '0.375rem',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {String(event['event'] ?? 'Event')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {event['timestamp']
                        ? new Date(String(event['timestamp'])).toLocaleString()
                        : ''}
                    </div>
                    {'actor' in event && event['actor'] ? (
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.125rem' }}>
                        by {String(event['actor'])}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </InfoCard>
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1rem',
        background: '#fff',
      }}
    >
      <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
  color,
  mono,
}: {
  label: string;
  value: string;
  color?: string;
  mono?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', fontSize: '0.875rem' }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ color: color || '#111827', fontFamily: mono ? 'monospace' : undefined, fontSize: mono ? '0.8125rem' : undefined }}>
        {value}
      </span>
    </div>
  );
}

function ActionButton({
  label,
  color,
  onClick,
  disabled,
}: {
  label: string;
  color: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '0.5rem',
        borderRadius: '0.375rem',
        border: `1px solid ${color}`,
        background: `${color}10`,
        color,
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  );
}
