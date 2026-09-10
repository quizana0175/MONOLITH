import React, { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import InventoryOverview from './components/InventoryOverview';
import OrderForm from './components/OrderForm';
import OrderHistory from './components/OrderHistory';
import { fetchInventory, submitOrder, fetchOrders } from './services/api';

export default function App() {
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, orderData] = await Promise.all([
        fetchInventory(),
        fetchOrders().catch(() => []),
      ]);
      setInventory(invData);
      setOrders(orderData);
      if (invData.length > 0 && !selectedProductId) {
        setSelectedProductId(invData[0].productId);
      }
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

  const handleOrderSubmit = async (productId, quantity) => {
    const result = await submitOrder(productId, quantity);
    // Refresh inventory and order list to reflect real-time updates
    await loadData();
    return result;
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
            <div className="brand-title">Quizana Shop</div>
            <div className="brand-tag">In-Process Order &amp; Inventory Management</div>
          </div>
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
          selectedProductId={selectedProductId}
          onSelectProduct={setSelectedProductId}
          onRefresh={loadData}
          loading={loading}
        />

        <OrderForm
          inventory={inventory}
          selectedProductId={selectedProductId}
          onSelectProduct={setSelectedProductId}
          onOrderSuccess={handleOrderSubmit}
          loading={loading}
        />
      </div>

      {/* Order Audit History */}
      <OrderHistory orders={orders} />
    </div>
  );
}
