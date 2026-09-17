import React, { useState, useEffect } from 'react';
import { ShoppingBag, Bell, Layers, Database } from 'lucide-react';
import InventoryOverview from './components/InventoryOverview';
import OrderForm from './components/OrderForm';
import OrderHistory from './components/OrderHistory';
import NotificationFeed from './components/NotificationFeed';
import { fetchInventory, submitOrder, cancelOrder, fetchOrders, fetchNotifications } from './services/api';

export default function App() {
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, orderData, notifData] = await Promise.all([
        fetchInventory(),
        fetchOrders().catch(() => []),
        fetchNotifications().catch(() => []),
      ]);
      setInventory(invData);
      setOrders(orderData);
      setNotifications(notifData);
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Could not connect to Spring Boot backend at http://localhost:8080. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateCartQuantity = (productId, qty) => {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[productId];
      } else {
        next[productId] = qty;
      }
      return next;
    });
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const handleClearCart = () => {
    setCart({});
  };

  const handleAddToCartFromOverview = (productId) => {
    handleUpdateCartQuantity(productId, (cart[productId] || 0) + 1);
  };

  const handleOrderSubmit = async (items) => {
    const result = await submitOrder(items);
    await loadData();
    return result;
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await cancelOrder(orderId);
      await loadData();
    } catch (err) {
      alert(`Failed to cancel order: ${err.message}`);
    }
  };

  return (
    <div className="app-container">
      {/* Sleek Minimal Topbar */}
      <div className="minimal-topbar">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <ShoppingBag size={22} />
          </div>
          <div>
            <div className="brand-title">Quizana Modular Monolith</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              padding: '0.3rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Layers size={13} />
          </span>
          <span
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#475569',
              padding: '0.3rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Database size={13} />
          </span>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}

      {/* Main Two-Column Grid */}
      <div className="main-grid">
        <InventoryOverview
          inventory={inventory}
          onAddToCart={handleAddToCartFromOverview}
          onRefresh={loadData}
          loading={loading}
        />

        <OrderForm
          inventory={inventory}
          cart={cart}
          onUpdateCartQuantity={handleUpdateCartQuantity}
          onRemoveFromCart={handleRemoveFromCart}
          onClearCart={handleClearCart}
          onOrderSuccess={handleOrderSubmit}
          loading={loading}
        />
      </div>

      {/* Notification Activity Feed (Domain Event Stream) */}
      <NotificationFeed
        notifications={notifications}
        onRefresh={loadData}
        loading={loading}
      />

      {/* Order Audit History with Cancellation */}
      <OrderHistory
        orders={orders}
        onCancelOrder={handleCancelOrder}
      />
    </div>
  );
}

