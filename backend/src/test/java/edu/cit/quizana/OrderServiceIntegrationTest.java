package edu.cit.quizana;

import edu.cit.quizana.inventory.InventoryItem;
import edu.cit.quizana.inventory.InventoryRepository;
import edu.cit.quizana.inventory.InventoryService;
import edu.cit.quizana.shop.Order;
import edu.cit.quizana.shop.OrderRepository;
import edu.cit.quizana.shop.OrderService;
import edu.cit.quizana.shop.OrderStatus;
import edu.cit.quizana.shop.dto.OrderRequest;
import edu.cit.quizana.shop.dto.OrderResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.lang.reflect.Modifier;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class OrderServiceIntegrationTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private OrderRepository orderRepository;

    @BeforeEach
    void setup() {
        orderRepository.deleteAll();
        inventoryRepository.deleteAll();

        // Seed initial specification items
        inventoryRepository.saveAll(List.of(
                new InventoryItem("P100", "Wireless Mouse", 25),
                new InventoryItem("P200", "Mechanical Keyboard", 10),
                new InventoryItem("P300", "USB-C Hub", 0)
        ));
    }

    @Test
    @DisplayName("Architectural Boundary: InventoryServiceImpl must be package-private")
    void testInventoryServiceImplIsPackagePrivate() throws ClassNotFoundException {
        Class<?> implClass = Class.forName("edu.cit.quizana.inventory.InventoryServiceImpl");
        int modifiers = implClass.getModifiers();
        assertFalse(Modifier.isPublic(modifiers), "InventoryServiceImpl MUST NOT be public (must be package-private).");
        assertFalse(Modifier.isProtected(modifiers), "InventoryServiceImpl MUST NOT be protected.");
        assertFalse(Modifier.isPrivate(modifiers), "InventoryServiceImpl MUST NOT be private.");
    }

    @Test
    @DisplayName("End-to-End Confirmed Order: Stock is deducted and order is saved as CONFIRMED")
    void testPlaceOrderConfirmed() {
        OrderRequest request = new OrderRequest("P100", 2);
        OrderResponse response = orderService.placeOrder(request);

        assertNotNull(response.getOrderId());
        assertEquals("P100", response.getProductId());
        assertEquals(2, response.getQuantity());
        assertEquals(OrderStatus.CONFIRMED, response.getStatus());
        assertNull(response.getReason());
        assertEquals(23, response.getInventory());

        // Verify database state for inventory
        InventoryItem updatedItem = inventoryRepository.findById("P100").orElseThrow();
        assertEquals(23, updatedItem.getStock());

        // Verify database state for orders
        Order savedOrder = orderRepository.findById(response.getOrderId()).orElseThrow();
        assertEquals(OrderStatus.CONFIRMED, savedOrder.getStatus());
        assertEquals(2, savedOrder.getQuantity());
        assertNull(savedOrder.getReason());
    }

    @Test
    @DisplayName("End-to-End Rejected Order: Exceeding stock results in REJECTED and preserves stock")
    void testPlaceOrderRejectedInsufficientStock() {
        OrderRequest request = new OrderRequest("P200", 15); // stock is 10
        OrderResponse response = orderService.placeOrder(request);

        assertNotNull(response.getOrderId());
        assertEquals("P200", response.getProductId());
        assertEquals(15, response.getQuantity());
        assertEquals(OrderStatus.REJECTED, response.getStatus());
        assertNotNull(response.getReason());
        assertTrue(response.getReason().contains("Insufficient stock"));
        assertEquals(10, response.getInventory());

        // Verify inventory stock remained unchanged
        InventoryItem item = inventoryRepository.findById("P200").orElseThrow();
        assertEquals(10, item.getStock());

        // Verify order was recorded as REJECTED in database
        Order savedOrder = orderRepository.findById(response.getOrderId()).orElseThrow();
        assertEquals(OrderStatus.REJECTED, savedOrder.getStatus());
        assertEquals(15, savedOrder.getQuantity());
        assertNotNull(savedOrder.getReason());
    }

    @Test
    @DisplayName("End-to-End Rejected Order: Zero stock product (P300) is REJECTED")
    void testPlaceOrderRejectedZeroStock() {
        OrderRequest request = new OrderRequest("P300", 1); // stock is 0
        OrderResponse response = orderService.placeOrder(request);

        assertEquals(OrderStatus.REJECTED, response.getStatus());
        assertEquals(0, response.getInventory());
        assertNotNull(response.getReason());

        InventoryItem item = inventoryRepository.findById("P300").orElseThrow();
        assertEquals(0, item.getStock());
    }
}
