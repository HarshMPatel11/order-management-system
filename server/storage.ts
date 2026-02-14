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
    const collection = db.collection('menu_items');
    const items = await collection.find({}).toArray();
    return items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
      category: item.category
    }));
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const collection = db.collection('menu_items');
    const item = await collection.findOne({ id });
    if (!item) return undefined;
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
      category: item.category
    };
  }

  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    // 1. Calculate total and fetch prices
    let totalAmount = 0;
    const itemsToInsert = [];
    const menuCollection = db.collection('menu_items');

    // Verify items exist and get prices
    for (const itemRequest of orderData.items) {
      const menuItem = await menuCollection.findOne({ id: itemRequest.menuItemId });
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
    const ordersCollection = db.collection('orders');
    const orderId = Date.now(); // Simple ID generation
    const newOrder = {
      id: orderId,
      customerName: orderData.customerName,
      address: orderData.address,
      phone: orderData.phone,
      totalAmount: totalAmount,
      status: "received",
      createdAt: new Date()
    };
    await ordersCollection.insertOne(newOrder);

    // 3. Create Order Items
    const orderItemsCollection = db.collection('order_items');
    for (const item of itemsToInsert) {
      await orderItemsCollection.insertOne({
        orderId: orderId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price
      });
    }

    return newOrder;
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const ordersCollection = db.collection('orders');
    const order = await ordersCollection.findOne({ id });
    
    if (!order) return undefined;

    // Fetch items with menu details
    const orderItemsCollection = db.collection('order_items');
    const items = await orderItemsCollection.find({ orderId: id }).toArray();
    
    const menuCollection = db.collection('menu_items');
    const itemsWithMenu = await Promise.all(items.map(async (item) => {
      const menuItem = await menuCollection.findOne({ id: item.menuItemId });
      return {
        ...item,
        menuItem
      };
    }));

    return { ...order, items: itemsWithMenu };
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const ordersCollection = db.collection('orders');
    await ordersCollection.updateOne({ id }, { $set: { status } });
    const updatedOrder = await ordersCollection.findOne({ id });
    return updatedOrder;
  }
}

export const storage = new DatabaseStorage();
