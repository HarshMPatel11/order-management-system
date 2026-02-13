import { z } from 'zod';
import { createOrderSchema, menuItems, orders } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  menu: {
    list: {
      method: 'GET' as const,
      path: '/api/menu' as const,
      responses: {
        200: z.array(z.custom<typeof menuItems.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/menu/:id' as const,
      responses: {
        200: z.custom<typeof menuItems.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  orders: {
    create: {
      method: 'POST' as const,
      path: '/api/orders' as const,
      input: createOrderSchema,
      responses: {
        201: z.custom<typeof orders.$inferSelect>(), // Returns the created order
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/orders/:id' as const,
      responses: {
        200: z.custom<typeof orders.$inferSelect & { items: any[] }>(), // Order with items
        404: errorSchemas.notFound,
      },
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
