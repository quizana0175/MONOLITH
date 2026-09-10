package edu.cit.quizana.shop;

import edu.cit.quizana.inventory.InventoryService;
import edu.cit.quizana.inventory.dto.ReservationResult;
import edu.cit.quizana.shop.dto.OrderRequest;
import edu.cit.quizana.shop.dto.OrderResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    private final InventoryService inventoryService;
    private final OrderRepository orderRepository;

    /**
     * Constructor injection with InventoryService interface.
     * OrderService has no compile-time dependency on InventoryServiceImpl (which is package-private).
     */
    public OrderService(InventoryService inventoryService, OrderRepository orderRepository) {
        this.inventoryService = inventoryService;
        this.orderRepository = orderRepository;
    }

    @Transactional
    public OrderResponse placeOrder(OrderRequest request) {
        String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        LocalDateTime now = LocalDateTime.now();

        // Call inventory service in-process to attempt stock reservation
        ReservationResult reservation = inventoryService.reserve(request.getProductId(), request.getQuantity());

        OrderStatus status;
        String reason;

        if (reservation.isSuccess()) {
            status = OrderStatus.CONFIRMED;
            reason = null;
        } else {
            status = OrderStatus.REJECTED;
            reason = reservation.getMessage();
        }

        // Persist order in the orders table regardless of confirmation or rejection
        Order order = Order.builder()
                .orderId(orderId)
                .productId(request.getProductId())
                .quantity(request.getQuantity())
                .status(status)
                .reason(reason)
                .createdAt(now)
                .build();

        orderRepository.save(order);

        return OrderResponse.builder()
                .orderId(orderId)
                .productId(request.getProductId())
                .quantity(request.getQuantity())
                .status(status)
                .reason(reason)
                .inventory(reservation.getRemainingStock())
                .createdAt(now)
                .build();
    }

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }
}
