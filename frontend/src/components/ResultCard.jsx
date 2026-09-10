import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Hash, Clock, Box } from 'lucide-react';

export default function ResultCard({ result }) {
  if (!result) return null;

  const isConfirmed = result.status === 'CONFIRMED';

  return (
    <div className={`result-banner ${isConfirmed ? 'confirmed' : 'rejected'}`}>
      <div className="result-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isConfirmed ? (
            <CheckCircle size={22} color="#34d399" />
          ) : (
            <XCircle size={22} color="#f87171" />
          )}
          <span className={`status-badge ${isConfirmed ? 'confirmed' : 'rejected'}`}>
            ORDER {result.status}
          </span>
        </div>
        <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>
          {result.orderId}
        </span>
      </div>

      <div className="result-meta">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Product Requested:</span>
          <span style={{ fontWeight: 600, color: 'black' }}>
            {result.productId} (Qty: {result.quantity})
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Updated Stock in DB:</span>
          <span style={{ fontWeight: 700, color: isConfirmed ? '#34d399' : '#fbbf24' }}>
            {result.inventory} units
          </span>
        </div>

        {result.reason && (
          <div className="result-reason">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
              <AlertTriangle size={15} color="#f87171" />
              <span>Rejection Reason:</span>
            </div>
            <div style={{ paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
              {result.reason}
            </div>
          </div>
        )}

        {result.createdAt && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
            <Clock size={12} />
            <span>Processed at: {new Date(result.createdAt).toLocaleTimeString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
