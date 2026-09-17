import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

export default function ResultCard({ result }) {
  if (!result) return null;

  const isConfirmed = result.status === 'CONFIRMED';
  const isCancelled = result.status === 'CANCELLED';

  const getStatusBadge = () => {
    if (isConfirmed) return <span className="status-badge confirmed">ORDER CONFIRMED</span>;
    if (isCancelled) return <span className="status-badge" style={{ color: '#64748b' }}>ORDER CANCELLED</span>;
    return <span className="status-badge rejected">ORDER REJECTED</span>;
  };

  const getIcon = () => {
    if (isConfirmed) return <CheckCircle size={22} color="#059669" />;
    if (isCancelled) return <RefreshCw size={22} color="#64748b" />;
    return <XCircle size={22} color="#dc2626" />;
  };

  return (
    <div className={`result-banner ${isConfirmed ? 'confirmed' : isCancelled ? 'cancelled' : 'rejected'}`}>
      <div className="result-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {getIcon()}
          {getStatusBadge()}
        </div>
        <span style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          {result.orderId}
        </span>
      </div>

      <div className="result-meta">
        {result.reason && (
          <div className="result-reason">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
              <AlertTriangle size={15} color="#dc2626" />
              <span>{isCancelled ? 'Cancellation Note:' : 'Rejection Reason:'}</span>
            </div>
            <div style={{ paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
              {result.reason}
            </div>
          </div>
        )}

        {result.items && result.items.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem' }}>
              Line Items &amp; Transaction Outcomes:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {result.items.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#ffffff',
                    padding: '0.35rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.8rem',
                  }}
                >
                  <span>
                    <strong>{it.productId}</strong> &times; {it.quantity}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: it.outcome?.includes('FAILED')
                        ? '#dc2626'
                        : it.outcome?.includes('RESERVED') || it.outcome?.includes('RESTOCKED')
                        ? '#059669'
                        : '#d97706',
                    }}
                  >
                    {it.outcome}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.createdAt && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            <Clock size={12} />
            <span>Processed at: {new Date(result.createdAt).toLocaleTimeString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

