import { db } from "./db";
import {
  menuItems,
  orders,
  orderItems,
  type MenuItem,
  type Order,
  type OrderWithItems,
  type CreateOrderRequest
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Menu
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  
  // Orders
  createOrder(orderData: CreateOrderRequest): Promise<Order>;
  getOrder(id: number): Promise<OrderWithItems | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
}

export class DatabaseStorage implements IStorage {
  async getMenuItems(): Promise<MenuItem[]> {
    return await db.select().from(menuItems);
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item;
  }

  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    // 1. Calculate total and fetch prices
    let totalAmount = 0;
    const itemsToInsert = [];

    // Verify items exist and get prices
    for (const itemRequest of orderData.items) {
      const [menuItem] = await db.select().from(menuItems).where(eq(menuItems.id, itemRequest.menuItemId));
      if (!menuItem) {
        throw new Error(`Menu item ${itemRequest.menuItemId} not found`);
      }
      totalAmount += menuItem.price * itemRequest.quantity;
      itemsToInsert.push({
        menuItemId: menuItem.id,
        quantity: itemRequest.quantity,
        price: menuItem.price
      });
    }

    // 2. Create Order
    const [newOrder] = await db.insert(orders).values({
      customerName: orderData.customerName,
      address: orderData.address,
      phone: orderData.phone,
      totalAmount: totalAmount,
      status: "received"
    }).returning();

    // 3. Create Order Items
    for (const item of itemsToInsert) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price
      });
    }

    return newOrder;
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    
    if (!order) return undefined;

    // Fetch items with menu details
    const items = await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, id),
      with: {
        menuItem: true
      }
    });

    return { ...order, items };
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updatedOrder] = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }
}

export const storage = new DatabaseStorage();
