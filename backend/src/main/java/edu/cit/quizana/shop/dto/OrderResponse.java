package edu.cit.quizana.shop.dto;

import edu.cit.quizana.shop.OrderStatus;

import java.time.LocalDateTime;

public class OrderResponse {

    private String orderId;
    private String productId;
    private int quantity;
    private OrderStatus status;
    private String reason;
    private int inventory;
    private LocalDateTime createdAt;

    public OrderResponse() {
    }

    public OrderResponse(String orderId, String productId, int quantity, OrderStatus status, String reason, int inventory, LocalDateTime createdAt) {
        this.orderId = orderId;
        this.productId = productId;
        this.quantity = quantity;
        this.status = status;
        this.reason = reason;
        this.inventory = inventory;
        this.createdAt = createdAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String orderId;
        private String productId;
        private int quantity;
        private OrderStatus status;
        private String reason;
        private int inventory;
        private LocalDateTime createdAt;

        public Builder orderId(String orderId) {
            this.orderId = orderId;
            return this;
        }

        public Builder productId(String productId) {
            this.productId = productId;
            return this;
        }

        public Builder quantity(int quantity) {
            this.quantity = quantity;
            return this;
        }

        public Builder status(OrderStatus status) {
            this.status = status;
            return this;
        }

        public Builder reason(String reason) {
            this.reason = reason;
            return this;
        }

        public Builder inventory(int inventory) {
            this.inventory = inventory;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public OrderResponse build() {
            return new OrderResponse(orderId, productId, quantity, status, reason, inventory, createdAt);
        }
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public int getInventory() {
        return inventory;
    }

    public void setInventory(int inventory) {
        this.inventory = inventory;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
