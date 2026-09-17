import React from 'react';
import { Bell, CheckCircle, AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export default function NotificationFeed({ notifications, onRefresh, loading }) {
  const getIcon = (message) => {
    if (message.includes('reorder needed') || message.includes('low on stock')) {
      return <AlertTriangle size={16} color="#d97706" />;
    }
    if (message.includes('rejected')) {
      return <AlertCircle size={16} color="#dc2626" />;
    }
    if (message.includes('cancelled')) {
      return <RefreshCw size={16} color="#64748b" />;
    }
    return <CheckCircle size={16} color="#059669" />;
  };

  const getItemStyle = (message) => {
    if (message.includes('reorder needed') || message.includes('low on stock')) {
      return { borderLeft: '4px solid #d97706', background: '#fffbeb' };
    }
    if (message.includes('rejected')) {
      return { borderLeft: '4px solid #dc2626', background: '#fef2f2' };
    }
    if (message.includes('cancelled')) {
      return { borderLeft: '4px solid #64748b', background: '#f8fafc' };
    }
    return { borderLeft: '4px solid #059669', background: '#ecfdf5' };
  };

  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      <div className="card-title">
        <div className="card-title-text">
          <Bell size={20} color="#059669" />
          <span>Notifications</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {notifications.length} events logged
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="btn-refresh"
            title="Refresh notifications"
          >
            <RefreshCw size={14} className={loading ? 'spinner' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>
          No notifications yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
          {notifications.map((n) => (
            <div
              key={n.notificationId}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                ...getItemStyle(n.message),
              }}
            >
              <div style={{ marginTop: '2px' }}>{getIcon(n.message)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 500 }}>
                  {n.message}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                  <span>{n.notificationId}</span>
                  <span>•</span>
                  <span>{n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : ''}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
