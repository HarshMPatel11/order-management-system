import type { Express } from "express";
import type { Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { db } from "./db";
import passport from 'passport';
import { hashPassword, isAuthenticated, isAdmin } from './auth';

// Store WebSocket clients
const wsClients = new Set<WebSocket>();

export async function registerRoutes(
  httpServer: Server | null,
  app: Express
): Promise<void> {
  
  await seedDatabase();

  if (httpServer) {
    const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

    wss.on('connection', (ws) => {
      console.log('WebSocket client connected');
      wsClients.add(ws);

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        wsClients.delete(ws);
      });
    });
  }

  // Helper to broadcast order updates
  function broadcastOrderUpdate(order: any) {
    const message = JSON.stringify({ type: 'orderUpdate', order });
    console.log(`Broadcasting update for order #${order.id}, status: ${order.status}, clients: ${wsClients.size}`);
    wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Authentication routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      
      // Hash password and create user
      const hashedPassword = hashPassword(input.password);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      
      // Log user in
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login failed after registration' });
        }
        const { password, ...userWithoutPassword } = user;
        res.status(201).json({ user: userWithoutPassword, message: 'Registration successful' });
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation Error', errors: err.errors });
      }
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  app.post(api.auth.login.path, (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: 'Internal Server Error' });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: 'Login failed' });
        }
        const { password, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword, message: 'Login successful' });
      });
    })(req, res, next);
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.logout(() => {
      res.json({ message: 'Logout successful' });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (req.isAuthenticated()) {
      const { password, ...userWithoutPassword } = req.user as any;
      res.json({ user: userWithoutPassword });
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  // Menu routes
  app.get(api.menu.list.path, async (req, res) => {
    const { category, search, minPrice, maxPrice } = req.query;
    const filters = {
      category: category as string | undefined,
      search: search as string | undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    };
    const items = await storage.getMenuItems(filters);
    res.json(items);
  });

  app.get(api.menu.get.path, async (req, res) => {
    const item = await storage.getMenuItem(Number(req.params.id));
    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    res.json(item);
  });

  app.post(api.menu.create.path, isAdmin, async (req, res) => {
    try {
      const item = await storage.createMenuItem(req.body);
      res.status(201).json(item);
    } catch (err) {
      res.status(500).json({ message: 'Failed to create menu item' });
    }
  });

  app.put(api.menu.update.path, isAdmin, async (req, res) => {
    try {
      const item = await storage.updateMenuItem(Number(req.params.id), req.body);
      if (!item) {
        return res.status(404).json({ message: 'Menu item not found' });
      }
      res.json(item);
    } catch (err) {
      res.status(500).json({ message: 'Failed to update menu item' });
    }
  });

  app.delete(api.menu.delete.path, isAdmin, async (req, res) => {
    const success = await storage.deleteMenuItem(Number(req.params.id));
    if (!success) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted' });
  });

  // Order routes
  app.post(api.orders.create.path, async (req, res) => {
    try {
      const input = api.orders.create.input.parse(req.body);
      const userId = req.isAuthenticated() ? (req.user as any).id : undefined;
      const order = await storage.createOrder(input, userId);
      
      if (process.env.NODE_ENV !== "test") {
        simulateOrderStatus(order.id, broadcastOrderUpdate);
      }
      
      broadcastOrderUpdate(order);
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation Error", errors: err.errors });
      }
      if (err instanceof Error) {
        return res.status(400).json({ message: err.message });
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

  app.get(api.orders.list.path, isAdmin, async (req, res) => {
    const orders = await storage.getAllOrders();
    res.json(orders);
  });

  app.get(api.orders.myOrders.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any)?.id;
    const orders = await storage.getUserOrders(userId);
    res.json(orders);
  });

  app.put(api.orders.updateStatus.path, isAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const order = await storage.updateOrderStatus(Number(req.params.id), status);
      broadcastOrderUpdate(order);
      res.json(order);
    } catch (err) {
      res.status(500).json({ message: 'Failed to update order status' });
    }
  });

  app.post(api.orders.cancel.path, async (req, res) => {
    const success = await storage.cancelOrder(Number(req.params.id));
    if (!success) {
      return res.status(400).json({ message: 'Order cannot be cancelled' });
    }
    res.json({ message: 'Order cancelled successfully' });
  });

  // Review routes
  app.post(api.reviews.create.path, async (req, res) => {
    try {
      const input = api.reviews.create.input.parse(req.body);
      const userId = req.isAuthenticated() ? (req.user as any).id : undefined;
      const review = await storage.createReview(input, userId);
      res.status(201).json(review);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation Error", errors: err.errors });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.reviews.list.path, async (req, res) => {
    const reviews = await storage.getMenuItemReviews(Number(req.params.menuItemId));
    res.json(reviews);
  });

  // Promo code routes
  app.post(api.promoCodes.create.path, isAdmin, async (req, res) => {
    try {
      const input = api.promoCodes.create.input.parse(req.body);
      const promoCode = await storage.createPromoCode(input);
      res.status(201).json(promoCode);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation Error", errors: err.errors });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post(api.promoCodes.validate.path, async (req, res) => {
    const { code, orderTotal } = req.body;
    const result = await storage.validatePromoCode(code, orderTotal);
    res.json(result);
  });

  app.get(api.promoCodes.list.path, isAdmin, async (req, res) => {
    const promoCodes = await storage.getAllPromoCodes();
    res.json(promoCodes);
  });

  // Analytics routes
  app.get(api.analytics.dashboard.path, isAdmin, async (req, res) => {
    const analytics = await storage.getAnalytics();
    res.json(analytics);
  });

}

function simulateOrderStatus(orderId: number, broadcastUpdate: (order: any) => void) {
  const statuses = ["preparing", "out_for_delivery", "delivered"];
  let delay = 10000; // 10 seconds between updates

  console.log(`Starting order simulation for order #${orderId}`);
  
  statuses.forEach((status, index) => {
    setTimeout(async () => {
      try {
        const order = await storage.updateOrderStatus(orderId, status);
        console.log(`Order #${orderId} updated to ${status}`);
        broadcastUpdate(order);
      } catch (e) {
        console.error(`Failed to update order ${orderId} status:`, e);
      }
    }, delay * (index + 1));
  });
}

export async function seedDatabase() {
  // Update existing menu items to ensure they are available
  const menuCollection = db.collection('menu_items');
  await menuCollection.updateMany(
    { isAvailable: { $ne: true } },
    { $set: { isAvailable: true } }
  );
  
  // Update existing menu items to set default values for new fields
  await menuCollection.updateMany(
    { averageRating: { $exists: false } },
    { $set: { averageRating: 0, totalReviews: 0, orderCount: 0 } }
  );
  
  const existingItems = await storage.getMenuItems();
  if (existingItems.length === 0) {
    console.log("Seeding database with menu items...");
    await menuCollection.insertMany([
      {
        id: 1,
        name: "Margherita Pizza",
        description: "Classic tomato sauce, fresh mozzarella, and basil.",
        price: 1299, // $12.99
        imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80",
        category: "Pizza",
        isAvailable: true,
        averageRating: 0,
        totalReviews: 0,
        orderCount: 0,
        createdAt: new Date()
      },
      {
        id: 2,
        name: "Pepperoni Feast",
        description: "Loaded with pepperoni and extra cheese.",
        price: 1499,
        imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=500&q=80",
        category: "Pizza",
        isAvailable: true,
        averageRating: 0,
        totalReviews: 0,
        orderCount: 0,
        createdAt: new Date()
      },
      {
        id: 3,
        name: "Classic Cheeseburger",
        description: "Juicy beef patty, cheddar, lettuce, tomato, house sauce.",
        price: 1099,
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80",
        category: "Burger",
        isAvailable: true,
        averageRating: 0,
        totalReviews: 0,
        orderCount: 0,
        createdAt: new Date()
      },
      {
        id: 4,
        name: "Spicy Chicken Burger",
        description: "Crispy chicken fillet with spicy mayo and pickles.",
        price: 1199,
        imageUrl: "https://images.unsplash.com/photo-1615297348928-867df3c467df?auto=format&fit=crop&w=500&q=80",
        category: "Burger",
        isAvailable: true,
        averageRating: 0,
        totalReviews: 0,
        orderCount: 0,
        createdAt: new Date()
      },
      {
        id: 5,
        name: "Caesar Salad",
        description: "Romaine lettuce, croutons, parmesan, caesar dressing.",
        price: 899,
        imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=500&q=80",
        category: "Salads",
        isAvailable: true,
        averageRating: 0,
        totalReviews: 0,
        orderCount: 0,
        createdAt: new Date()
      },
      {
        id: 6,
        name: "Truffle Fries",
        description: "Crispy fries tossed with truffle oil and parmesan.",
        price: 699,
        imageUrl: "https://images.unsplash.com/photo-1573080496982-b94a8add0dd5?auto=format&fit=crop&w=500&q=80",
        category: "Sides",
        isAvailable: true,
        averageRating: 0,
        totalReviews: 0,
        orderCount: 0,
        createdAt: new Date()
      }
    ]);
    console.log("Database seeded with menu items!");
  }
  
  // Seed admin user if none exists
  const usersCollection = db.collection('users');
  const adminUser = await usersCollection.findOne({ email: 'admin@orderflow.com' });
  if (!adminUser) {
    console.log("Creating admin user...");
    const adminId = Date.now();
    await usersCollection.insertOne({
      id: adminId,
      email: 'admin@orderflow.com',
      password: hashPassword('admin123'), // Default password
      name: 'Admin User',
      phone: null,
      role: 'admin',
      createdAt: new Date()
    });
    console.log("Admin user created! Email: admin@orderflow.com, Password: admin123");
  }
}

