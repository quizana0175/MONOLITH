import React from 'react';
import { History } from 'lucide-react';

export default function OrderHistory({ orders }) {
  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      <div className="card-title">
        <div className="card-title-text">
          <History size={20} color="#059669" />
          <span>Orders Audit Log</span>
        </div>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          {orders.length} total recorded
        </span>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>
          No orders placed yet. Select a product and place an order above.
        </div>
      ) : (
        <div className="table-container">
          <table className="order-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Details / Reason</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.orderId}>
                  <td className="mono-cell" style={{ color: '#047857', fontWeight: 600 }}>
                    {o.orderId}
                  </td>
                  <td className="mono-cell">{o.productId}</td>
                  <td style={{ fontWeight: 600 }}>{o.quantity}</td>
                  <td>
                    <span className={o.status === 'CONFIRMED' ? 'pill-confirmed' : 'pill-rejected'}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: o.reason ? '#fca5a5' : '#9ca3af' }}>
                    {o.reason || 'Reservation successful'}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {new Date(o.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
