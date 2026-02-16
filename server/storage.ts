import { db } from "./db";
import {
  type MenuItem,
  type Order,
  type OrderWithItems,
  type CreateOrderRequest,
  type User,
  type Review,
  type PromoCode,
  type RegisterRequest,
  type CreateReviewRequest,
  type CreatePromoCodeRequest,
  type UpdateMenuItemRequest,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(userData: RegisterRequest & { password: string }): Promise<User>;
  
  // Menu
  getMenuItems(filters?: { category?: string; search?: string; minPrice?: number; maxPrice?: number }): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(data: any): Promise<MenuItem>;
  updateMenuItem(id: number, data: UpdateMenuItemRequest): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;
  
  // Orders
  createOrder(orderData: CreateOrderRequest, userId?: number): Promise<Order>;
  getOrder(id: number): Promise<OrderWithItems | undefined>;
  getAllOrders(limit?: number): Promise<OrderWithItems[]>;
  getUserOrders(userId: number): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<OrderWithItems>;
  cancelOrder(id: number): Promise<boolean>;
  
  // Reviews
  createReview(reviewData: CreateReviewRequest, userId?: number): Promise<Review>;
  getMenuItemReviews(menuItemId: number): Promise<Review[]>;
  updateMenuItemRating(menuItemId: number): Promise<void>;
  
  // Promo Codes
  createPromoCode(data: CreatePromoCodeRequest): Promise<PromoCode>;
  validatePromoCode(code: string, orderTotal: number): Promise<{ valid: boolean; discount?: number; promoCode?: PromoCode; message: string }>;
  getAllPromoCodes(): Promise<PromoCode[]>;
  incrementPromoCodeUsage(id: number): Promise<void>;
  
  // Analytics
  getAnalytics(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    const collection = db.collection('users');
    const user = await collection.findOne({ email });
    return user as User | undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const collection = db.collection('users');
    const user = await collection.findOne({ id });
    return user as User | undefined;
  }

  async createUser(userData: RegisterRequest & { password: string }): Promise<User> {
    const collection = db.collection('users');
    const userId = Date.now();
    const newUser = {
      id: userId,
      email: userData.email,
      password: userData.password,
      name: userData.name,
      phone: userData.phone || null,
      role: 'customer',
      createdAt: new Date()
    };
    await collection.insertOne(newUser);
    return newUser as User;
  }

  // Menu methods
  async getMenuItems(filters?: { category?: string; search?: string; minPrice?: number; maxPrice?: number }): Promise<MenuItem[]> {
    const collection = db.collection('menu_items');
    const query: any = {};
    
    if (filters?.category) {
      query.category = filters.category;
    }
    
    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
    }
    
    const items = await collection.find(query).toArray();
    return items as MenuItem[];
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const collection = db.collection('menu_items');
    const item = await collection.findOne({ id });
    return item as MenuItem | undefined;
  }

  async createMenuItem(data: any): Promise<MenuItem> {
    const collection = db.collection('menu_items');
    const id = Date.now();
    const newItem = {
      id,
      ...data,
      isAvailable: true,
      averageRating: 0,
      totalReviews: 0,
      orderCount: 0,
      createdAt: new Date()
    };
    await collection.insertOne(newItem);
    return newItem as MenuItem;
  }

  async updateMenuItem(id: number, data: UpdateMenuItemRequest): Promise<MenuItem | undefined> {
    const collection = db.collection('menu_items');
    await collection.updateOne({ id }, { $set: data });
    return this.getMenuItem(id);
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    const collection = db.collection('menu_items');
    const result = await collection.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async createOrder(orderData: CreateOrderRequest, userId?: number): Promise<Order> {
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
      
      // Increment order count for popularity
      await menuCollection.updateOne(
        { id: menuItem.id },
        { $inc: { orderCount: itemRequest.quantity } }
      );
    }

    // Apply promo code if provided
    let discountAmount = 0;
    let promoCodeId = null;
    let finalAmount = totalAmount;
    
    if (orderData.promoCode) {
      const promoValidation = await this.validatePromoCode(orderData.promoCode, totalAmount);
      if (promoValidation.valid && promoValidation.promoCode) {
        discountAmount = promoValidation.discount || 0;
        finalAmount = totalAmount - discountAmount;
        promoCodeId = promoValidation.promoCode.id;
        await this.incrementPromoCodeUsage(promoCodeId);
      }
    }

    // 2. Create Order
    const ordersCollection = db.collection('orders');
    const orderId = Date.now();
    const newOrder = {
      id: orderId,
      userId: userId || null,
      customerName: orderData.customerName,
      address: orderData.address,
      phone: orderData.phone,
      email: orderData.email || null,
      totalAmount: totalAmount,
      discountAmount: discountAmount,
      finalAmount: finalAmount,
      promoCodeId: promoCodeId,
      paymentStatus: 'pending',
      paymentMethod: orderData.paymentMethod || 'cash',
      notes: orderData.notes || null,
      status: "received",
      canCancel: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await ordersCollection.insertOne(newOrder);

    // 3. Create Order Items
    const orderItemsCollection = db.collection('order_items');
    for (const item of itemsToInsert) {
      await orderItemsCollection.insertOne({
        id: Date.now() + Math.random(),
        orderId: orderId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price
      });
    }

    return newOrder as Order;
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

    return { ...order, items: itemsWithMenu } as OrderWithItems;
  }

  async getAllOrders(limit: number = 50): Promise<OrderWithItems[]> {
    const ordersCollection = db.collection('orders');
    const orders = await ordersCollection.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
    
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const orderDetails = await this.getOrder(order.id);
      return orderDetails!;
    }));
    
    return ordersWithItems.filter(o => o !== undefined);
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    const ordersCollection = db.collection('orders');
    const orders = await ordersCollection.find({ userId }).sort({ createdAt: -1 }).toArray();
    return orders as Order[];
  }

  async updateOrderStatus(id: number, status: string): Promise<OrderWithItems> {
    const ordersCollection = db.collection('orders');
    const canCancel = status === 'received';
    await ordersCollection.updateOne(
      { id },
      { $set: { status, canCancel, updatedAt: new Date() } }
    );
    // Return the full order with items
    const updatedOrder = await this.getOrder(id);
    if (!updatedOrder) {
      throw new Error('Order not found after update');
    }
    return updatedOrder;
  }

  async cancelOrder(id: number): Promise<boolean> {
    const order = await this.getOrder(id);
    if (!order || !order.canCancel) {
      return false;
    }
    await this.updateOrderStatus(id, 'cancelled');
    return true;
  }

  // Review methods
  async createReview(reviewData: CreateReviewRequest, userId?: number): Promise<Review> {
    const collection = db.collection('reviews');
    const reviewId = Date.now();
    const newReview = {
      id: reviewId,
      menuItemId: reviewData.menuItemId,
      userId: userId || null,
      orderId: reviewData.orderId || null,
      rating: reviewData.rating,
      comment: reviewData.comment || null,
      createdAt: new Date()
    };
    await collection.insertOne(newReview);
    
    // Update menu item rating
    await this.updateMenuItemRating(reviewData.menuItemId);
    
    return newReview as Review;
  }

  async getMenuItemReviews(menuItemId: number): Promise<Review[]> {
    const collection = db.collection('reviews');
    const reviews = await collection.find({ menuItemId }).sort({ createdAt: -1 }).toArray();
    
    // Fetch user details for each review
    const usersCollection = db.collection('users');
    const reviewsWithUsers = await Promise.all(reviews.map(async (review) => {
      if (review.userId) {
        const user = await usersCollection.findOne({ id: review.userId });
        return { ...review, user: user ? { id: user.id, name: user.name } : null };
      }
      return review;
    }));
    
    return reviewsWithUsers as Review[];
  }

  async updateMenuItemRating(menuItemId: number): Promise<void> {
    const reviewsCollection = db.collection('reviews');
    const menuCollection = db.collection('menu_items');
    
    const reviews = await reviewsCollection.find({ menuItemId }).toArray();
    if (reviews.length === 0) return;
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = (totalRating / reviews.length).toFixed(2);
    
    await menuCollection.updateOne(
      { id: menuItemId },
      { $set: { averageRating: parseFloat(averageRating), totalReviews: reviews.length } }
    );
  }

  // Promo code methods
  async createPromoCode(data: CreatePromoCodeRequest): Promise<PromoCode> {
    const collection = db.collection('promo_codes');
    const promoId = Date.now();
    const newPromo = {
      id: promoId,
      code: data.code.toUpperCase(),
      discountType: data.discountType,
      discountValue: data.discountValue,
      minimumOrder: data.minimumOrder || 0,
      maxUses: data.maxUses || null,
      usedCount: 0,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: true,
      createdAt: new Date()
    };
    await collection.insertOne(newPromo);
    return newPromo as PromoCode;
  }

  async validatePromoCode(code: string, orderTotal: number): Promise<{ valid: boolean; discount?: number; promoCode?: PromoCode; message: string }> {
    const collection = db.collection('promo_codes');
    const promo = await collection.findOne({ code: code.toUpperCase() }) as PromoCode | null;
    
    if (!promo) {
      return { valid: false, message: 'Invalid promo code' };
    }
    
    if (!promo.isActive) {
      return { valid: false, message: 'Promo code is inactive' };
    }
    
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return { valid: false, message: 'Promo code has expired' };
    }
    
    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return { valid: false, message: 'Promo code usage limit reached' };
    }
    
    if (orderTotal < promo.minimumOrder) {
      return { valid: false, message: `Minimum order amount is $${(promo.minimumOrder / 100).toFixed(2)}` };
    }
    
    let discount = 0;
    if (promo.discountType === 'percentage') {
      discount = Math.floor((orderTotal * promo.discountValue) / 100);
    } else {
      discount = promo.discountValue;
    }
    
    return { valid: true, discount, promoCode: promo, message: 'Promo code applied successfully' };
  }

  async getAllPromoCodes(): Promise<PromoCode[]> {
    const collection = db.collection('promo_codes');
    const promos = await collection.find({}).toArray();
    return promos as PromoCode[];
  }

  async incrementPromoCodeUsage(id: number): Promise<void> {
    const collection = db.collection('promo_codes');
    await collection.updateOne({ id }, { $inc: { usedCount: 1 } });
  }

  // Analytics methods
  async getAnalytics(): Promise<any> {
    const ordersCollection = db.collection('orders');
    const menuCollection = db.collection('menu_items');
    
    // Total revenue
    const orders = await ordersCollection.find({}).toArray();
    const totalRevenue = orders.reduce((sum, order) => sum + (order.finalAmount || order.totalAmount), 0);
    const totalOrders = orders.length;
    
    // Orders by status
    const ordersByStatus = orders.reduce((acc: any, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
    
    // Popular items
    const popularItems = await menuCollection
      .find({})
      .sort({ orderCount: -1 })
      .limit(5)
      .toArray();
    
    // Recent orders
    const recentOrders = await this.getAllOrders(10);
    
    return {
      totalRevenue,
      totalOrders,
      ordersByStatus,
      popularItems,
      recentOrders
    };
  }
}

export const storage = new DatabaseStorage();
