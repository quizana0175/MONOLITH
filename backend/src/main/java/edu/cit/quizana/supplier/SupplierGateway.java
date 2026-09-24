package edu.cit.quizana.supplier;

public interface SupplierGateway {
    ReorderResult orderReplenishment(String productId, int unitsNeeded);
}
