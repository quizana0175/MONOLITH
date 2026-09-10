package edu.cit.quizana.shop;

import edu.cit.quizana.inventory.InventoryService;
import edu.cit.quizana.inventory.dto.InventoryItemDto;
import edu.cit.quizana.shop.dto.OrderRequest;
import edu.cit.quizana.shop.dto.OrderResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class OrderController {

    private final OrderService orderService;
    private final InventoryService inventoryService;

    public OrderController(OrderService orderService, InventoryService inventoryService) {
        this.orderService = orderService;
        this.inventoryService = inventoryService;
    }

    /**
     * POST /api/orders
     * Request: { "productId": "P100", "quantity": 2 }
     * Response: { "orderId": "...", "productId": "P100", "quantity": 2, "status": "CONFIRMED", "reason": null, "inventory": 23, "createdAt": "..." }
     */
    @PostMapping("/orders")
    public ResponseEntity<OrderResponse> placeOrder(@Valid @RequestBody OrderRequest request) {
        OrderResponse response = orderService.placeOrder(request);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/inventory
     * Returns list of inventory items for frontend dropdown and stock status.
     */
    @GetMapping("/inventory")
    public ResponseEntity<List<InventoryItemDto>> getInventory() {
        List<InventoryItemDto> items = inventoryService.getAllItems();
        return ResponseEntity.ok(items);
    }

    /**
     * GET /api/orders
     * Returns order history.
     */
    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getOrders() {
        List<Order> orders = orderService.getAllOrders();
        return ResponseEntity.ok(orders);
    }
}
