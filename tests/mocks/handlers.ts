/**
 * Mock Service Worker Setup
 * Configure MSW for API mocking in tests
 */

import { rest } from 'msw';
import type { User, Product, Order } from '@/types/index.js';

// Mock data
const mockUsers: User[] = [
  {
    id: 1,
    username: 'johndoe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  },
  {
    id: 2,
    username: 'janedoe',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
  },
];

const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Laptop Pro',
    price: 1299.99,
    description: 'High-performance laptop for professionals',
    inStock: true,
  },
  {
    id: 2,
    name: 'Wireless Mouse',
    price: 29.99,
    description: 'Ergonomic wireless mouse',
    inStock: true,
  },
  {
    id: 3,
    name: 'USB-C Cable',
    price: 14.99,
    description: 'Durable USB-C charging cable',
    inStock: true,
  },
];

const mockOrders: Order[] = [
  {
    id: 1,
    userId: 1,
    items: [
      { productId: 1, quantity: 1, price: 1299.99 },
      { productId: 2, quantity: 2, price: 29.99 },
    ],
    total: 1359.97,
    status: 'shipped',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 2,
    userId: 2,
    items: [{ productId: 3, quantity: 5, price: 14.99 }],
    total: 74.95,
    status: 'pending',
    createdAt: '2024-01-16T14:20:00Z',
  },
];

// Setup handlers
export const handlers = [
  // User endpoints
  rest.get('/api/users', (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockUsers));
  }),

  rest.get('/api/users/:id', (req, res, ctx) => {
    const userId = Number(req.params.id);
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) {
      return res(ctx.status(404), ctx.json({ error: 'User not found' }));
    }
    return res(ctx.status(200), ctx.json(user));
  }),

  rest.post('/api/users', (req, res, ctx) => {
    const body = req.body as Partial<User>;
    const newUser: User = {
      id: Math.max(...mockUsers.map((u) => u.id), 0) + 1,
      username: body.username || 'newuser',
      firstName: body.firstName || 'New',
      lastName: body.lastName || 'User',
      email: body.email || 'new@example.com',
    };
    mockUsers.push(newUser);
    return res(ctx.status(201), ctx.json(newUser));
  }),

  // Product endpoints
  rest.get('/api/products', (req, res, ctx) => {
    const limit = parseInt(req.url.searchParams.get('limit') || '10');
    const search = req.url.searchParams.get('q');

    let results = mockProducts;
    if (search) {
      results = results.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    return res(ctx.status(200), ctx.json(results.slice(0, limit)));
  }),

  rest.get('/api/products/search', (req, res, ctx) => {
    const searchTerm = req.url.searchParams.get('q') || '';
    const filtered = mockProducts.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return res(ctx.status(200), ctx.json(filtered));
  }),

  rest.get('/api/products/:id', (req, res, ctx) => {
    const product = mockProducts.find((p) => p.id === Number(req.params.id));
    if (!product) {
      return res(ctx.status(404), ctx.json({ error: 'Product not found' }));
    }
    return res(ctx.status(200), ctx.json(product));
  }),

  rest.patch('/api/products/:id', (req, res, ctx) => {
    const product = mockProducts.find((p) => p.id === Number(req.params.id));
    if (!product) {
      return res(ctx.status(404), ctx.json({ error: 'Product not found' }));
    }
    const updates = req.body as Partial<Product>;
    Object.assign(product, updates);
    return res(ctx.status(200), ctx.json(product));
  }),

  // Order endpoints
  rest.get('/api/orders', (req, res, ctx) => {
    const status = req.url.searchParams.get('status');
    let results = mockOrders;
    if (status) {
      results = results.filter((o) => o.status === status);
    }
    return res(ctx.status(200), ctx.json(results));
  }),

  rest.get('/api/orders/:id', (req, res, ctx) => {
    const order = mockOrders.find((o) => o.id === Number(req.params.id));
    if (!order) {
      return res(ctx.status(404), ctx.json({ error: 'Order not found' }));
    }
    return res(ctx.status(200), ctx.json(order));
  }),

  rest.post('/api/orders', (req, res, ctx) => {
    const body = req.body as Partial<Order>;

    if (!body.userId) {
      return res(ctx.status(400), ctx.json({ error: 'userId is required' }));
    }
    if (!body.items || body.items.length === 0) {
      return res(ctx.status(400), ctx.json({ error: 'Order must contain at least one item' }));
    }

    for (const item of body.items) {
      if ((item.quantity || 0) <= 0) {
        return res(ctx.status(400), ctx.json({ error: 'Quantity must be greater than 0' }));
      }
    }

    const newOrder: Order = {
      id: Math.max(...mockOrders.map((o) => o.id), 0) + 1,
      userId: body.userId,
      items: body.items,
      total: (body.items || []).reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
        0
      ),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    mockOrders.push(newOrder);
    return res(ctx.status(201), ctx.json(newOrder));
  }),

  rest.put('/api/orders/:id', (req, res, ctx) => {
    const order = mockOrders.find((o) => o.id === Number(req.params.id));
    if (!order) {
      return res(ctx.status(404), ctx.json({ error: 'Order not found' }));
    }

    const updates = req.body as Partial<Order>;
    if (updates.status) {
      const validStatuses: Array<'pending' | 'processing' | 'shipped' | 'delivered'> = 
        ['pending', 'processing', 'shipped', 'delivered'];
      if (!validStatuses.includes(updates.status)) {
        return res(ctx.status(400), ctx.json({ error: 'Invalid status' }));
      }
    }

    Object.assign(order, updates);
    return res(ctx.status(200), ctx.json(order));
  }),
];
