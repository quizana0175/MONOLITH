const API_BASE = 'http://localhost:8080/api';

/**
 * Fetch all inventory items
 */
export async function fetchInventory() {
  const response = await fetch(`${API_BASE}/inventory`);
  if (!response.ok) {
    throw new Error(`Failed to fetch inventory: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Submit an order request (multi-item support)
 * @param {Array<{productId: string, quantity: number}>} items
 */
export async function submitOrder(items) {
  const body = Array.isArray(items) ? { items } : items;
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message || `Order request failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Cancel an order and restock its items
 * @param {string} orderId
 */
export async function cancelOrder(orderId) {
  const response = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}/cancel`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message || `Cancel request failed with HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch order history
 */
export async function fetchOrders() {
  const response = await fetch(`${API_BASE}/orders`);
  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch notifications activity feed
 */
export async function fetchNotifications() {
  const response = await fetch(`${API_BASE}/notifications`);
  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.statusText}`);
  }
  return response.json();
}

