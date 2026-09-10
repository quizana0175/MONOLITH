import React from 'react';
import { Package, RefreshCw } from 'lucide-react';

export default function InventoryOverview({ inventory, selectedProductId, onSelectProduct, onRefresh, loading }) {
  const getBadgeClass = (stock) => {
    if (stock <= 0) return 'stock-badge out-of-stock';
    if (stock <= 5) return 'stock-badge low-stock';
    return 'stock-badge in-stock';
  };

  const getBadgeText = (stock) => {
    if (stock <= 0) return 'Out of Stock (0)';
    if (stock <= 5) return `Low Stock (${stock})`;
    return `In Stock (${stock})`;
  };

  return (
    <div className="card">
      <div className="card-title">
        <div className="card-title-text">
          <Package size={20} color="#059669" />
          <span>Live Inventory</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.8rem',
          }}
          title="Refresh inventory"
        >
          <RefreshCw size={14} className={loading ? 'spinner' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="inventory-grid">
        {inventory.map((item) => {
          const isSelected = selectedProductId === item.productId;
          return (
            <div
              key={item.productId}
              className={`inventory-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectProduct(item.productId)}
              style={{ cursor: 'pointer' }}
            >
              <div className="item-id">{item.productId}</div>
              <div className="item-name">{item.name}</div>
              <div className="item-stock">
                <span style={{ color: '#9ca3af' }}>Available:</span>
                <span className={getBadgeClass(item.stock)}>
                  {getBadgeText(item.stock)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
