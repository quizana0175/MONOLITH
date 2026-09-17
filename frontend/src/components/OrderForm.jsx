import React, { useState } from 'react';
import { ShoppingCart, Send, Plus, Trash2, ShoppingBag } from 'lucide-react';
import ResultCard from './ResultCard';

export default function OrderForm({ inventory, cart, onUpdateCartQuantity, onRemoveFromCart, onClearCart, onOrderSuccess, loading }) {
  const [selectedProductId, setSelectedProductId] = useState(inventory[0]?.productId || 'P100');
  const [inputQty, setInputQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddToCart = (e) => {
    e?.preventDefault();
    if (!selectedProductId) return;
    const qty = Math.max(1, parseInt(inputQty, 10) || 1);
    onUpdateCartQuantity(selectedProductId, (cart[selectedProductId] || 0) + qty);
  };

  const handleCheckout = async () => {
    const items = Object.entries(cart)
      .filter(([_, q]) => q > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (items.length === 0) {
      setErrorMessage('Your cart is empty. Please add items before submitting.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      const response = await onOrderSuccess(items);
      setLastResult(response);
      onClearCart();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  const cartEntries = Object.entries(cart).filter(([_, q]) => q > 0);
  const totalUnits = cartEntries.reduce((sum, [_, q]) => sum + q, 0);

  return (
    <div className="card">
      <div className="card-title">
        <div className="card-title-text">
          <ShoppingCart size={20} color="#059669" />
          <span>Cart &amp; Checkout</span>
        </div>
        {cartEntries.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.75rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Clear Cart
          </button>
        )}
      </div>

      {/* Add Item to Cart Form */}
      <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem', color: '#334155' }}>
          Add Products to Cart
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
          <select
            className="form-select"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            disabled={submitting || loading || inventory.length === 0}
            style={{ padding: '0.5rem' }}
          >
            {inventory.map((item) => (
              <option key={item.productId} value={item.productId}>
                {item.productId} - {item.name} (Stock: {item.stock})
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            className="form-input"
            style={{ textAlign: 'center', padding: '0.5rem' }}
            value={inputQty}
            onChange={(e) => setInputQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
            disabled={submitting}
          />

          <button
            type="button"
            onClick={handleAddToCart}
            className="btn-submit"
            style={{ padding: '0.5rem 0.85rem', height: '100%', fontSize: '0.85rem' }}
            disabled={submitting || !selectedProductId}
          >
            <Plus size={16} />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Cart Items List */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
          <span>Current Cart ({cartEntries.length} items, {totalUnits} total units)</span>
        </div>

        {cartEntries.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', border: '1.5px dashed #cbd5e1', borderRadius: '8px', color: '#94a3b8', fontSize: '0.85rem' }}>
            <ShoppingBag size={30} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <br />Cart is empty.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {cartEntries.map(([productId, qty]) => {
              const product = inventory.find((i) => i.productId === productId);
              return (
                <div
                  key={productId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.75rem',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {product ? product.name : productId}{' '}
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#059669', fontSize: '0.75rem' }}>
                        ({productId})
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Available Stock: <strong>{product ? product.stock : '?'}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="quantity-controls" style={{ transform: 'scale(0.85)', transformOrigin: 'right' }}>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => onUpdateCartQuantity(productId, qty - 1)}
                        disabled={qty <= 1 || submitting}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        style={{ width: '45px', textAlign: 'center', fontWeight: 700, padding: '0.2rem' }}
                        value={qty}
                        onChange={(e) => onUpdateCartQuantity(productId, Math.max(1, parseInt(e.target.value, 10) || 1))}
                        disabled={submitting}
                      />
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => onUpdateCartQuantity(productId, qty + 1)}
                        disabled={submitting}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveFromCart(productId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        cursor: 'pointer',
                        padding: '0.25rem',
                      }}
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {errorMessage && (
        <div style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {errorMessage}
        </div>
      )}

      <button
        type="button"
        onClick={handleCheckout}
        className="btn-submit"
        disabled={submitting || cartEntries.length === 0}
      >
        {submitting ? (
          <>
            <div className="spinner" />
            <span>Submitting Order</span>
          </>
        ) : (
          <>
            <Send size={18} />
            <span>Submit Order</span>
          </>
        )}
      </button>

      <ResultCard result={lastResult} />
    </div>
  );
}

