/**
 * Mock Service Worker Setup
 * Configure MSW for API mocking in tests
 */

import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';
import type { User, Product, Order } from '@/types/index.js';

// Mock data
const mockUsers: User[] = [
  {
    id: 1,
    username: 'johndoe',
    name: 'John Doe',
    email: 'john@example.com',
  },
  {
    id: 2,
    username: 'janedoe',
    name: 'Jane Doe',
    email: 'jane@example.com',
  },
];

const mockProducts: Product[] = [
  {
    id: 1,
    title: 'Laptop Pro',
    price: 1299.99,
    description: 'High-performance laptop for professionals',
    stock: 50,
  },
  {
    id: 2,
    title: 'Wireless Mouse',
    price: 29.99,
    description: 'Ergonomic wireless mouse',
    stock: 200,
  },
  {
    id: 3,
    title: 'USB-C Cable',
    price: 14.99,
    description: 'Durable USB-C charging cable',
    stock: 500,
  },
];

const mockOrders: Order[] = [
  {
    id: 1,
    userId: 1,
    items: [
      { productId: 1, quantity: 1, unitPrice: 1299.99 },
      { productId: 2, quantity: 2, unitPrice: 29.99 },
    ],
    total: 1359.97,
    status: 'completed',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
  },
  {
    id: 2,
    userId: 2,
    items: [{ productId: 3, quantity: 5, unitPrice: 14.99 }],
    total: 74.95,
    status: 'pending',
    createdAt: '2024-01-16T14:20:00Z',
    updatedAt: '2024-01-16T14:20:00Z',
  },
];

// Setup handlers
export const handlers = [
  // User endpoints
  http.get('/api/users', async () => {
    await delay(300);
    return HttpResponse.json(mockUsers);
  }),

  http.get('/api/users/:id', async ({ params }) => {
    await delay(200);
    const user = mockUsers.find((u) => u.id === Number(params.id));
    if (!user) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return HttpResponse.json(user);
  }),

  http.post('/api/users', async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as Partial<User>;
    const newUser: User = {
      id: Math.max(...mockUsers.map((u) => u.id)) + 1,
      username: body.username || 'newuser',
      name: body.name || 'New User',
      email: body.email || 'new@example.com',
    };
    mockUsers.push(newUser);
    return HttpResponse.json(newUser, { status: 201 });
  }),

  // Product endpoints
  http.get('/api/products', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('q');

    let results = mockProducts;
    if (search) {
      results = results.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    return HttpResponse.json(results.slice(0, limit));
  }),

  http.get('/api/products/search', async ({ request }) => {
    await delay(350);
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('q') || '';
    const filtered = mockProducts.filter((p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return HttpResponse.json(filtered);
  }),

  http.get('/api/products/:id', async ({ params }) => {
    await delay(200);
    const product = mockProducts.find((p) => p.id === Number(params.id));
    if (!product) {
      return HttpResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json(product);
  }),

  http.patch('/api/products/:id', async ({ params, request }) => {
    await delay(300);
    const product = mockProducts.find((p) => p.id === Number(params.id));
    if (!product) {
      return HttpResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    const updates = (await request.json()) as Partial<Product>;
    Object.assign(product, updates);
    return HttpResponse.json(product);
  }),

  // Order endpoints
  http.get('/api/orders', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    let results = mockOrders;
    if (status) {
      results = results.filter((o) => o.status === status);
    }
    return HttpResponse.json(results);
  }),

  http.get('/api/orders/:id', async ({ params }) => {
    await delay(200);
    const order = mockOrders.find((o) => o.id === Number(params.id));
    if (!order) {
      return HttpResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return HttpResponse.json(order);
  }),

  http.post('/api/orders', async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as Partial<Order>;

    // Validation
    if (!body.userId) {
      return HttpResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    if (!body.items || body.items.length === 0) {
      return HttpResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of body.items) {
      if ((item.quantity || 0) <= 0) {
        return HttpResponse.json(
          { error: 'Quantity must be greater than 0' },
          { status: 400 }
        );
      }
    }

    const newOrder: Order = {
      id: Math.max(...mockOrders.map((o) => o.id)) + 1,
      userId: body.userId,
      items: body.items,
      total: (body.items || []).reduce(
        (sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 0),
        0
      ),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockOrders.push(newOrder);
    return HttpResponse.json(newOrder, { status: 201 });
  }),

  http.put('/api/orders/:id', async ({ params, request }) => {
    await delay(300);
    const order = mockOrders.find((o) => o.id === Number(params.id));
    if (!order) {
      return HttpResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updates = (await request.json()) as Partial<Order>;
    if (updates.status) {
      const validStatuses = ['pending', 'completed', 'cancelled'];
      if (!validStatuses.includes(updates.status)) {
        return HttpResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
    }

    Object.assign(order, updates, {
      updatedAt: new Date().toISOString(),
    });
    return HttpResponse.json(order);
  }),
];

// Export configured server
export const server = setupServer(...handlers);
