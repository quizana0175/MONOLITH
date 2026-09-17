import React from 'react';
import { Package, RefreshCw, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export default function InventoryOverview({ inventory, onAddToCart, onRefresh, loading }) {
  const getCardStatusClass = (stock) => {
    if (stock <= 0) return 'inventory-item out-of-stock-card';
    if (stock <= 5) return 'inventory-item low-stock-card';
    return 'inventory-item in-stock-card';
  };

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
          <span>Inventory</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn-refresh"
          title="Refresh inventory"
        >
          <RefreshCw size={14} className={loading ? 'spinner' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="inventory-grid">
        {inventory.map((item) => {
          const isLowStock = item.stock > 0 && item.stock <= 5;
          const isOutOfStock = item.stock <= 0;

          return (
            <div
              key={item.productId}
              className={getCardStatusClass(item.stock)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="item-id">{item.productId}</span>
                {isOutOfStock && <XCircle size={16} color="#dc2626" />}
                {isLowStock && <AlertTriangle size={16} color="#d97706" />}
                {!isLowStock && !isOutOfStock && <CheckCircle2 size={16} color="#059669" />}
              </div>
              <div className="item-name">{item.name}</div>
              <div className="item-stock">
                <span style={{ color: '#64748b' }}>Stock:</span>
                <span className={getBadgeClass(item.stock)}>
                  {getBadgeText(item.stock)}
                </span>
              </div>
              {onAddToCart && (
                <button
                  type="button"
                  onClick={() => onAddToCart(item.productId)}
                  className="btn-add-cart"
                  style={{
                    marginTop: '0.75rem',
                    width: '100%',
                    padding: '0.4rem 0.6rem',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: '#334155',
                    transition: 'all 0.15s',
                  }}
                >
                  + Add to Cart
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

