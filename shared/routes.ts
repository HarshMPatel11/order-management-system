import { z } from 'zod';
import { 
  createOrderSchema, 
  menuItems, 
  orders, 
  registerSchema, 
  loginSchema,
  createReviewSchema,
  createPromoCodeSchema,
  updateMenuItemSchema
} from './schema';


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
  unauthorized: z.object({
    message: z.string(),
  }),
};


export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: registerSchema,
      responses: {
        201: z.object({ user: z.any(), message: z.string() }),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: loginSchema,
      responses: {
        200: z.object({ user: z.any(), message: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.object({ user: z.any() }),
        401: errorSchemas.unauthorized,
      },
    },
  },
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
    },
    create: {
      method: 'POST' as const,
      path: '/api/menu' as const,
      input: z.any(),
      responses: {
        201: z.custom<typeof menuItems.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/menu/:id' as const,
      input: updateMenuItemSchema,
      responses: {
        200: z.custom<typeof menuItems.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/menu/:id' as const,
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  orders: {
    create: {
      method: 'POST' as const,
      path: '/api/orders' as const,
      input: createOrderSchema,
      responses: {
        201: z.custom<typeof orders.$inferSelect>(), 
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/orders/:id' as const,
      responses: {
        200: z.custom<typeof orders.$inferSelect & { items: any[] }>(), 
        404: errorSchemas.notFound,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/orders' as const,
      responses: {
        200: z.array(z.any()),
      },
    },
    myOrders: {
      method: 'GET' as const,
      path: '/api/orders/me' as const,
      responses: {
        200: z.array(z.any()),
        401: errorSchemas.unauthorized,
      },
    },
    updateStatus: {
      method: 'PUT' as const,
      path: '/api/orders/:id/status' as const,
      input: z.object({ status: z.string() }),
      responses: {
        200: z.custom<typeof orders.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    cancel: {
      method: 'POST' as const,
      path: '/api/orders/:id/cancel' as const,
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
        400: errorSchemas.validation,
      },
    },
  },
  reviews: {
    create: {
      method: 'POST' as const,
      path: '/api/reviews' as const,
      input: createReviewSchema,
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/menu/:menuItemId/reviews' as const,
      responses: {
        200: z.array(z.any()),
      },
    },
  },
  promoCodes: {
    create: {
      method: 'POST' as const,
      path: '/api/promo-codes' as const,
      input: createPromoCodeSchema,
      responses: {
        201: z.any(),
        401: errorSchemas.unauthorized,
      },
    },
    validate: {
      method: 'POST' as const,
      path: '/api/promo-codes/validate' as const,
      input: z.object({ code: z.string(), orderTotal: z.number() }),
      responses: {
        200: z.object({ valid: z.boolean(), discount: z.number().optional(), message: z.string() }),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/promo-codes' as const,
      responses: {
        200: z.array(z.any()),
        401: errorSchemas.unauthorized,
      },
    },
  },
  analytics: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/analytics/dashboard' as const,
      responses: {
        200: z.object({
          totalRevenue: z.number(),
          totalOrders: z.number(),
          popularItems: z.array(z.any()),
          recentOrders: z.array(z.any()),
          ordersByStatus: z.any(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
  },
};


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
