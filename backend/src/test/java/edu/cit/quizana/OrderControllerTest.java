package edu.cit.quizana;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.cit.quizana.inventory.InventoryItem;
import edu.cit.quizana.inventory.InventoryRepository;
import edu.cit.quizana.shop.OrderRepository;
import edu.cit.quizana.shop.dto.OrderRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private OrderRepository orderRepository;

    @BeforeEach
    void setup() {
        orderRepository.deleteAll();
        inventoryRepository.deleteAll();

        inventoryRepository.saveAll(List.of(
                new InventoryItem("P100", "Wireless Mouse", 25),
                new InventoryItem("P200", "Mechanical Keyboard", 10),
                new InventoryItem("P300", "USB-C Hub", 0)
        ));
    }

    @Test
    @DisplayName("REST POST /api/orders -> 200 OK CONFIRMED")
    void testPostOrderConfirmed() throws Exception {
        OrderRequest request = new OrderRequest("P100", 3);

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId", notNullValue()))
                .andExpect(jsonPath("$.productId", is("P100")))
                .andExpect(jsonPath("$.quantity", is(3)))
                .andExpect(jsonPath("$.status", is("CONFIRMED")))
                .andExpect(jsonPath("$.reason", nullValue()))
                .andExpect(jsonPath("$.inventory", is(22)));
    }

    @Test
    @DisplayName("REST POST /api/orders -> 200 OK REJECTED when exceeding stock")
    void testPostOrderRejected() throws Exception {
        OrderRequest request = new OrderRequest("P300", 1); // stock is 0

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId", notNullValue()))
                .andExpect(jsonPath("$.productId", is("P300")))
                .andExpect(jsonPath("$.status", is("REJECTED")))
                .andExpect(jsonPath("$.reason", containsString("Insufficient stock")))
                .andExpect(jsonPath("$.inventory", is(0)));
    }

    @Test
    @DisplayName("REST GET /api/inventory -> Returns all seeded items")
    void testGetInventory() throws Exception {
        mockMvc.perform(get("/api/inventory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].productId", notNullValue()))
                .andExpect(jsonPath("$[0].name", notNullValue()));
    }
}
