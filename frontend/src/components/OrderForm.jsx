import React, { useState } from 'react';
import { ShoppingCart, Send, Minus, Plus } from 'lucide-react';
import ResultCard from './ResultCard';

export default function OrderForm({ inventory, selectedProductId, onSelectProduct, onOrderSuccess, loading }) {
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedItem = inventory.find((i) => i.productId === selectedProductId);

  const handleQuantityChange = (val) => {
    const num = Math.max(1, parseInt(val, 10) || 1);
    setQuantity(num);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      setErrorMessage('Please select a product.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      const response = await onOrderSuccess(selectedProductId, quantity);
      setLastResult(response);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title">
        <div className="card-title-text">
          <ShoppingCart size={20} color="#059669" />
          <span>Place New Order</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="product-select">
            Select Product:
          </label>
          <select
            id="product-select"
            className="form-select"
            value={selectedProductId}
            onChange={(e) => onSelectProduct(e.target.value)}
            disabled={submitting || loading}
          >
            {inventory.map((item) => (
              <option key={item.productId} value={item.productId}>
                {item.productId} — {item.name} (Stock: {item.stock})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="quantity-input">
            Quantity:
          </label>
          <div className="quantity-controls">
            <button
              type="button"
              className="qty-btn"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1 || submitting}
            >
              <Minus size={16} />
            </button>
            <input
              id="quantity-input"
              type="number"
              min="1"
              className="form-input"
              style={{ textAlign: 'center', fontWeight: 700 }}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              disabled={submitting}
            />
            <button
              type="button"
              className="qty-btn"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={submitting}
            >
              <Plus size={16} />
            </button>
          </div>
          {selectedItem && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#9ca3af' }}>
              Current available stock in inventory: <strong style={{ color: selectedItem.stock > 0 ? '#34d399' : '#f87171' }}>{selectedItem.stock}</strong>
            </div>
          )}
        </div>

        {errorMessage && (
          <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          className="btn-submit"
          disabled={submitting || !selectedProductId || inventory.length === 0}
        >
          {submitting ? (
            <>
              <div className="spinner" />
              <span>Processing In-Process Order...</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span>Submit Order</span>
            </>
          )}
        </button>
      </form>

      <ResultCard result={lastResult} />
    </div>
  );
}
