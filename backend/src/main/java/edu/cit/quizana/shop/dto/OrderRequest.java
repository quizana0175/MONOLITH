package edu.cit.quizana.shop.dto;

import jakarta.validation.Valid;

import java.util.ArrayList;
import java.util.List;

public class OrderRequest {

    @Valid
    private List<OrderItemRequest> items = new ArrayList<>();

    // Backward compatibility fields for single-item order requests
    private String productId;
    private Integer quantity;

    public OrderRequest() {
    }

    public OrderRequest(List<OrderItemRequest> items) {
        this.items = items != null ? items : new ArrayList<>();
    }

    public OrderRequest(String productId, int quantity) {
        this.productId = productId;
        this.quantity = quantity;
        this.items = List.of(new OrderItemRequest(productId, quantity));
    }

    public List<OrderItemRequest> getItems() {
        if ((items == null || items.isEmpty()) && productId != null && quantity != null) {
            return List.of(new OrderItemRequest(productId, quantity));
        }
        return items != null ? items : new ArrayList<>();
    }

    public void setItems(List<OrderItemRequest> items) {
        this.items = items;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}

