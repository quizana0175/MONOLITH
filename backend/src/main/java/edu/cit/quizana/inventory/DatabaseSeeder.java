package edu.cit.quizana.inventory;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final InventoryRepository inventoryRepository;

    public DatabaseSeeder(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    @Override
    public void run(String... args) {
        if (inventoryRepository.count() == 0) {
            log.info("Seeding initial inventory data...");
            inventoryRepository.saveAll(List.of(
                    new InventoryItem("P100", "Wireless Mouse", 25),
                    new InventoryItem("P200", "Mechanical Keyboard", 10),
                    new InventoryItem("P300", "USB-C Hub", 0)
            ));
            log.info("Inventory seeded successfully with P100 (25), P200 (10), P300 (0).");
        } else {
            log.info("Inventory table already populated. Skipping seeder.");
        }
    }
}
