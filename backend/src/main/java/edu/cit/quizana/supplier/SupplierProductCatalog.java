package edu.cit.quizana.supplier;

import org.springframework.stereotype.Component;
import java.util.Map;

@Component
class SupplierProductCatalog {

    record SupplierItem(String supplierSku, int packSize) {}

    private final Map<String, SupplierItem> catalog = Map.of(
        "P100", new SupplierItem("QBN-4549", 10), // WIRELESS MOUSE 2.4GHZ (PackSize: 10)
        "P200", new SupplierItem("QBN-3220", 10), // KEYBOARD MECH TKL (PackSize: 10)
        "P300", new SupplierItem("QBN-2379", 10)  // USB HUB 4-PORT (PackSize: 10)
    );

    public SupplierItem resolve(String productId) {
        SupplierItem item = catalog.get(productId);
        if (item == null) {
            throw new IllegalArgumentException("No supplier SKU mapped for product: " + productId);
        }
        return item;
    }
}