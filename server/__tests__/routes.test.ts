import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from '../routes';
import { client } from '../db';

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

beforeAll(async () => {
  await client.connect();
  await registerRoutes(httpServer, app);
});

afterAll(async () => {
  await client.close();
});

describe('API Endpoints', () => {
  describe('GET /api/menu', () => {
    it('should return menu items', async () => {
      const response = await request(app).get('/api/menu');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('price');
      }
    });
  });

  describe('POST /api/orders', () => {
    it('should create an order with valid data', async () => {
      const orderData = {
        customerName: 'John Doe',
        address: '123 Main St',
        phone: '1234567890',
        items: [{ menuItemId: 1, quantity: 2 }]
      };
      const response = await request(app).post('/api/orders').send(orderData);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('received');
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        customerName: '',
        address: '123 Main St',
        phone: '123',
        items: []
      };
      const response = await request(app).post('/api/orders').send(invalidData);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return order details', async () => {
      // First create an order
      const orderData = {
        customerName: 'Jane Doe',
        address: '456 Elm St',
        phone: '0987654321',
        items: [{ menuItemId: 2, quantity: 1 }]
      };
      const createResponse = await request(app).post('/api/orders').send(orderData);
      const orderId = createResponse.body.id;

      const response = await request(app).get(`/api/orders/${orderId}`);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(orderId);
      expect(response.body).toHaveProperty('status');
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app).get('/api/orders/99999');
      expect(response.status).toBe(404);
    });
  });
});