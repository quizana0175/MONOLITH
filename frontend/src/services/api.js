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
 * Submit an order request
 * @param {string} productId
 * @param {number} quantity
 */
export async function submitOrder(productId, quantity) {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId, quantity: Number(quantity) }),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message || `Order request failed with HTTP ${response.status}`);
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
