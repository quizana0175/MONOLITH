import React, { useState } from 'react';
import { History, XOctagon } from 'lucide-react';

export default function OrderHistory({ orders, onCancelOrder }) {
  const [cancellingId, setCancellingId] = useState(null);

  const handleCancel = async (orderId) => {
    setCancellingId(orderId);
    try {
      await onCancelOrder(orderId);
    } finally {
      setCancellingId(null);
    }
  };

  const getPillClass = (status) => {
    if (status === 'CONFIRMED') return 'pill-confirmed';
    if (status === 'CANCELLED') return 'pill-cancelled';
    return 'pill-rejected';
  };

  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      <div className="card-title">
        <div className="card-title-text">
          <History size={20} color="#059669" />
          <span>Orders Audit Log &amp; Live Tracking</span>
        </div>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          {orders.length} total recorded
        </span>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>
          No orders placed yet. Build a cart and place an order above.
        </div>
      ) : (
        <div className="table-container">
          <table className="order-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Line Items</th>
                <th>Status</th>
                <th>Details / Reason</th>
                <th>Time</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const isConfirmed = o.status === 'CONFIRMED';
                const isCancelling = cancellingId === o.orderId;

                return (
                  <tr key={o.orderId}>
                    <td className="mono-cell" style={{ color: '#047857', fontWeight: 600 }}>
                      {o.orderId}
                    </td>
                    <td>
                      {o.items && o.items.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {o.items.map((it, idx) => (
                            <span
                              key={idx}
                              style={{
                                background: '#f1f5f9',
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {it.productId} &times; {it.quantity}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span className={getPillClass(o.status)}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: o.status === 'REJECTED' ? '#dc2626' : o.status === 'CANCELLED' ? '#64748b' : '#059669' }}>
                      {o.reason || (isConfirmed ? 'All items reserved' : '')}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {o.createdAt ? new Date(o.createdAt).toLocaleTimeString() : ''}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isConfirmed ? (
                        <button
                          type="button"
                          onClick={() => handleCancel(o.orderId)}
                          disabled={isCancelling}
                          style={{
                            background: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fca5a5',
                            padding: '0.25rem 0.55rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <XOctagon size={13} />
                          <span>{isCancelling ? 'Cancelling...' : 'Cancel'}</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

