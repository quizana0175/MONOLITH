package edu.cit.quizana.inventory;

import edu.cit.quizana.inventory.dto.InventoryItemDto;
import edu.cit.quizana.inventory.dto.ReservationResult;

import java.util.List;

public interface InventoryService {

    /**
     * Retrieve inventory details for a product by its ID.
     */
    InventoryItemDto getItem(String productId);

    /**
     * Attempt to reserve a given quantity of product from inventory.
     * Decrements the stock if sufficient stock exists, or rejects the request.
     */
    ReservationResult reserve(String productId, int quantity);

    /**
     * Retrieve all inventory items (used by frontend dropdown/catalog).
     */
    List<InventoryItemDto> getAllItems();
}
