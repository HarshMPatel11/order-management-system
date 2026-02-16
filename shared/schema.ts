import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // Stored in cents
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(), // e.g., "Pizza", "Burger", "Drinks"
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  // Status: received -> preparing -> out_for_delivery -> delivered
  status: text("status").notNull().default("received"), 
  totalAmount: integer("total_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(), // Price at time of order
});

// === RELATIONS ===

export const orderRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
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

// === BASE SCHEMAS ===

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, status: true, totalAmount: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===

export type MenuItem = typeof menuItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;

// Composite type for Order with items
export type OrderWithItems = Order & {
  items: (OrderItem & { menuItem: MenuItem })[];
};

// Request types
export const createOrderSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone is required"),
  items: z.array(z.object({
    menuItemId: z.number(),
    quantity: z.number().min(1)
  })).min(1, "Order must have at least one item")
});

export type CreateOrderRequest = z.infer<typeof createOrderSchema>;

// Response types
export type MenuListResponse = MenuItem[];
