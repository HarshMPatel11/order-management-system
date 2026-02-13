import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { menuItems } from "@shared/schema";
import { db } from "./db";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Menu Routes
  app.get(api.menu.list.path, async (req, res) => {
    const items = await storage.getMenuItems();
    res.json(items);
  });

  app.get(api.menu.get.path, async (req, res) => {
    const item = await storage.getMenuItem(Number(req.params.id));
    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    res.json(item);
  });

  // Order Routes
  app.post(api.orders.create.path, async (req, res) => {
    try {
      const input = api.orders.create.input.parse(req.body);
      const order = await storage.createOrder(input);
      
      // SIMULATION: Automatically advance order status for demo purposes
      simulateOrderStatus(order.id);
      
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation Error",
          errors: err.errors
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.orders.get.path, async (req, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  });

  // Seed data on startup
  await seedDatabase();

  return httpServer;
}

// Helper to simulate status updates
function simulateOrderStatus(orderId: number) {
  const statuses = ["preparing", "out_for_delivery", "delivered"];
  let delay = 5000; // 5 seconds between updates

  statuses.forEach((status, index) => {
    setTimeout(async () => {
      try {
        await storage.updateOrderStatus(orderId, status);
        console.log(`Order ${orderId} updated to ${status}`);
      } catch (e) {
        console.error(`Failed to update order ${orderId} status:`, e);
      }
    }, delay * (index + 1));
  });
}

// Seed function to populate menu
export async function seedDatabase() {
  const existingItems = await storage.getMenuItems();
  if (existingItems.length === 0) {
    console.log("Seeding database with menu items...");
    await db.insert(menuItems).values([
      {
        name: "Margherita Pizza",
        description: "Classic tomato sauce, fresh mozzarella, and basil.",
        price: 1299, // $12.99
        imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80",
        category: "Pizza"
      },
      {
        name: "Pepperoni Feast",
        description: "Loaded with pepperoni and extra cheese.",
        price: 1499,
        imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=500&q=80",
        category: "Pizza"
      },
      {
        name: "Classic Cheeseburger",
        description: "Juicy beef patty, cheddar, lettuce, tomato, house sauce.",
        price: 1099,
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80",
        category: "Burger"
      },
      {
        name: "Spicy Chicken Burger",
        description: "Crispy chicken fillet with spicy mayo and pickles.",
        price: 1199,
        imageUrl: "https://images.unsplash.com/photo-1615297348928-867df3c467df?auto=format&fit=crop&w=500&q=80",
        category: "Burger"
      },
      {
        name: "Caesar Salad",
        description: "Romaine lettuce, croutons, parmesan, caesar dressing.",
        price: 899,
        imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=500&q=80",
        category: "Salads"
      },
      {
        name: "Truffle Fries",
        description: "Crispy fries tossed with truffle oil and parmesan.",
        price: 699,
        imageUrl: "https://images.unsplash.com/photo-1573080496982-b94a8add0dd5?auto=format&fit=crop&w=500&q=80",
        category: "Sides"
      }
    ]);
    console.log("Database seeded!");
  }
}
