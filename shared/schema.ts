import { pgTable, text, serial, integer, timestamp, boolean, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table for authentication and profiles
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("customer"), // customer, admin
  createdAt: timestamp("created_at").defaultNow(),
});

// User saved addresses
export const userAddresses = pgTable("user_addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  label: text("label").notNull(), // Home, Work, etc.
  address: text("address").notNull(),
  isDefault: boolean("is_default").default(false),
});

// Menu items with enhanced fields
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), 
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  isAvailable: boolean("is_available").default(true),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  totalReviews: integer("total_reviews").default(0),
  orderCount: integer("order_count").default(0), // for popularity
  createdAt: timestamp("created_at").defaultNow(),
});

// Promo codes table
export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull(), // percentage, fixed
  discountValue: integer("discount_value").notNull(),
  minimumOrder: integer("minimum_order").default(0),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders table with enhanced fields
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // nullable for guest orders
  customerName: text("customer_name").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  status: text("status").notNull().default("received"), 
  totalAmount: integer("total_amount").notNull(),
  discountAmount: integer("discount_amount").default(0),
  finalAmount: integer("final_amount").notNull(),
  promoCodeId: integer("promo_code_id"),
  paymentStatus: text("payment_status").default("pending"), // pending, paid, failed
  paymentMethod: text("payment_method"), // card, cash
  notes: text("notes"),
  canCancel: boolean("can_cancel").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(), 
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id").notNull(),
  userId: integer("user_id"),
  orderId: integer("order_id"),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});


// Relations
export const userRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  addresses: many(userAddresses),
  reviews: many(reviews),
}));

export const userAddressRelations = relations(userAddresses, ({ one }) => ({
  user: one(users, {
    fields: [userAddresses.userId],
    references: [users.id],
  }),
}));

export const menuItemRelations = relations(menuItems, ({ many }) => ({
  orderItems: many(orderItems),
  reviews: many(reviews),
}));

export const orderRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  promoCode: one(promoCodes, {
    fields: [orders.promoCodeId],
    references: [promoCodes.id],
  }),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));

export const reviewRelations = relations(reviews, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [reviews.menuItemId],
    references: [menuItems.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
}));

export const promoCodeRelations = relations(promoCodes, ({ many }) => ({
  orders: many(orders),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertUserAddressSchema = createInsertSchema(userAddresses).omit({ id: true });
export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true, createdAt: true, averageRating: true, totalReviews: true, orderCount: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true, status: true, totalAmount: true, finalAmount: true, discountAmount: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({ id: true, createdAt: true, usedCount: true });

// Types
export type User = typeof users.$inferSelect;
export type UserAddress = typeof userAddresses.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type PromoCode = typeof promoCodes.$inferSelect;

export type OrderWithItems = Order & {
  items: (OrderItem & { menuItem: MenuItem })[];
};

export type MenuItemWithReviews = MenuItem & {
  reviews: (Review & { user?: Pick<User, 'id' | 'name'> })[];
};

// Validation schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createOrderSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional(),
  promoCode: z.string().optional(),
  paymentMethod: z.enum(["card", "cash"]).default("cash"),
  notes: z.string().optional(),
  items: z.array(z.object({
    menuItemId: z.number(),
    quantity: z.number().min(1)
  })).min(1, "Order must have at least one item")
});

export const createReviewSchema = z.object({
  menuItemId: z.number(),
  orderId: z.number().optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const createPromoCodeSchema = z.object({
  code: z.string().min(1),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().min(0),
  minimumOrder: z.number().min(0).default(0),
  maxUses: z.number().optional(),
  expiresAt: z.string().optional(),
});

export const updateMenuItemSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  imageUrl: z.string().optional(),
  category: z.string().optional(),
  isAvailable: z.boolean().optional(),
});

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type CreateOrderRequest = z.infer<typeof createOrderSchema>;
export type CreateReviewRequest = z.infer<typeof createReviewSchema>;
export type CreatePromoCodeRequest = z.infer<typeof createPromoCodeSchema>;
export type UpdateMenuItemRequest = z.infer<typeof updateMenuItemSchema>;

export type MenuListResponse = MenuItem[];
