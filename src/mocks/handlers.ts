/**
 * MSW Request Handlers
 * Mock handlers for all API endpoints in test environment
 */

import { http, HttpResponse } from 'msw';
import type { OrderStatus } from '../types/index';

const API_BASE_URL = 'https://jsonplaceholder.typicode.com';

interface MockOrder {
  id: number;
  userId: number;
  items: Array<{ productId: number; quantity: number; price: number }>;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

/**
 * In-memory store for orders to persist state changes across requests
 */
const orderStore = new Map<number, MockOrder>([
  [
    1,
    {
      id: 1,
      userId: 1,
      items: [
        { productId: 1, quantity: 2, price: 99.99 },
        { productId: 2, quantity: 1, price: 199.99 },
      ],
      total: 399.97,
      status: 'pending',
      createdAt: '2024-01-15T10:00:00Z',
    },
  ],
  [
    2,
    {
      id: 2,
      userId: 2,
      items: [{ productId: 3, quantity: 1, price: 49.99 }],
      total: 49.99,
      status: 'processing',
      createdAt: '2024-01-16T14:30:00Z',
    },
  ],
  [
    3,
    {
      id: 3,
      userId: 1,
      items: [{ productId: 4, quantity: 3, price: 29.99 }],
      total: 89.97,
      status: 'delivered',
      createdAt: '2024-01-17T09:15:00Z',
    },
  ],
  [
    4,
    {
      id: 4,
      userId: 2,
      items: [{ productId: 5, quantity: 1, price: 149.99 }],
      total: 149.99,
      status: 'shipped',
      createdAt: '2024-01-18T11:45:00Z',
    },
  ],
  [
    5,
    {
      id: 5,
      userId: 1,
      items: [{ productId: 1, quantity: 1, price: 99.99 }],
      total: 99.99,
      status: 'cancelled',
      createdAt: '2024-01-19T16:20:00Z',
    },
  ],
]);

/**
 * Mock API handlers for users endpoints
 */
const userHandlers = [
  http.get(`${API_BASE_URL}/users`, () => {
    return HttpResponse.json(
      [
        {
          id: 1,
          username: 'Bret',
          email: 'bret@example.com',
          firstName: 'Bret',
          lastName: 'Deleon',
          role: 'user' as const,
        },
        {
          id: 2,
          username: 'antonette',
          email: 'antonette@example.com',
          firstName: 'Antonette',
          lastName: 'Schmeler',
          role: 'user' as const,
        },
        ...Array.from({ length: 8 }, (_, i) => ({
          id: i + 3,
          username: `user${i + 3}`,
          email: `user${i + 3}@example.com`,
          firstName: `User${i + 3}`,
          lastName: 'Test',
          role: 'user' as const,
        })),
      ],
      { status: 200 }
    );
  }),

  http.get(`${API_BASE_URL}/users/:id`, ({ params }) => {
    const userId = parseInt(params.id as string);
    // Return 404 for non-existent users (ID > 11)
    if (userId > 11) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return HttpResponse.json(
      {
        id: userId,
        username: `user${userId}`,
        email: `user${userId}@example.com`,
        firstName: `User${userId}`,
        lastName: 'Test',
        role: 'user' as const,
      },
      { status: 200 }
    );
  }),

  http.post(`${API_BASE_URL}/users`, async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json(
      {
        id: 11,
        username: body?.username || 'newuser',
        email: body?.email || 'newuser@example.com',
        firstName: body?.firstName || 'New',
        lastName: body?.lastName || 'User',
        role: 'user' as const,
      },
      { status: 201 }
    );
  }),

  http.put(`${API_BASE_URL}/users/:id`, async ({ request }) => {
    const body = (await request.json()) as any;
    const userId = 1;
    return HttpResponse.json(
      {
        id: userId,
        username: body?.username || `user${userId}`,
        email: body?.email || `user${userId}@example.com`,
        role: 'user' as const,
      },
      { status: 200 }
    );
  }),
];

/**
 * Mock API handlers for products endpoints
 */
const productHandlers = [
  http.get(`${API_BASE_URL}/products`, ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');

    return HttpResponse.json(
      Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        description: `This is product ${i + 1}`,
        price: Math.floor(Math.random() * 1000) + 10,
        image: `https://via.placeholder.com/200`,
        category: ['Electronics', 'Clothing', 'Books', 'Toys'][i % 4],
        inStock: i % 2 === 0,
      })),
      { status: 200 }
    );
  }),

  // Special routes MUST come before parameterized routes in MSW
  http.get(`${API_BASE_URL}/products/search`, ({ request }) => {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('q') || '';

    const results = [
      {
        id: 1,
        name: `${searchTerm} Laptop`,
        description: `High-quality ${searchTerm} laptop`,
        price: 1299.99,
        inStock: true,
        category: 'Electronics',
      },
      {
        id: 2,
        name: `${searchTerm} Case`,
        description: `Protective ${searchTerm} case`,
        price: 49.99,
        inStock: true,
        category: 'Accessories',
      },
    ];

    return HttpResponse.json(results, { status: 200 });
  }),

  // Parameterized route comes AFTER specific routes
  http.get(`${API_BASE_URL}/products/:id`, ({ params }) => {
    const productId = parseInt(params.id as string);
    return HttpResponse.json(
      {
        id: productId,
        name: `Product ${productId}`,
        description: `This is product ${productId}`,
        price: 99.99,
        image: `https://via.placeholder.com/200`,
        category: 'Electronics',
        inStock: true,
      },
      { status: 200 }
    );
  }),

  http.patch(`${API_BASE_URL}/products/:id`, async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json(
      {
        id: 1,
        name: 'Updated Product',
        description: 'Updated description',
        price: body?.price || 99.99,
        inStock: body?.inStock !== undefined ? body.inStock : true,
        category: 'Electronics',
      },
      { status: 200 }
    );
  }),
];

/**
 * Mock API handlers for orders endpoints
 */
const orderHandlers = [
  http.get(`${API_BASE_URL}/orders`, ({ request }) => {
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status');
    let orders = Array.from(orderStore.values());

    // Filter by status if provided
    if (statusFilter) {
      orders = orders.filter((order) => order.status === statusFilter);
    }

    return HttpResponse.json(orders, { status: 200 });
  }),

  http.get(`${API_BASE_URL}/orders/:id`, ({ params }) => {
    const orderId = parseInt(params.id as string);
    const order =
      orderStore.get(orderId) ||
      ({
        id: orderId,
        userId: 1,
        items: [],
        total: 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
      } as MockOrder);
    return HttpResponse.json(order, { status: 200 });
  }),

  http.post(`${API_BASE_URL}/orders`, async ({ request }) => {
    const body = (await request.json()) as any;
    const newOrderId = Math.max(...Array.from(orderStore.keys()), 0) + 1;

    // Calculate total from items if not provided
    let total = body?.total || 0;
    if (!total && body?.items && body.items.length > 0) {
      total = body.items.reduce((sum: number, item: any) => {
        const itemPrice = (item.unitPrice || 50) * (item.quantity || 1);
        return sum + itemPrice;
      }, 0);
    }

    const newOrder: MockOrder = {
      id: newOrderId,
      userId: body?.userId,
      items: body?.items || [],
      total: total,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    orderStore.set(newOrderId, newOrder);
    return HttpResponse.json(newOrder, { status: 201 });
  }),

  http.put(`${API_BASE_URL}/orders/:id`, async ({ request, params }) => {
    const orderId = parseInt(params.id as string);
    const body = (await request.json()) as any;
    const existingOrder = orderStore.get(orderId);
    const updatedOrder: MockOrder = {
      ...(existingOrder || {
        id: orderId,
        userId: 1,
        items: [],
        total: 0,
        createdAt: new Date().toISOString(),
      }),
      status: body?.status || 'pending',
    } as MockOrder;
    orderStore.set(orderId, updatedOrder);
    return HttpResponse.json(updatedOrder, { status: 200 });
  }),

  http.patch(`${API_BASE_URL}/orders/:id`, async ({ request, params }) => {
    const orderId = parseInt(params.id as string);
    const body = (await request.json()) as any;
    const existingOrder = orderStore.get(orderId);
    const patchedOrder: MockOrder = {
      ...(existingOrder || {
        id: orderId,
        userId: 1,
        items: [],
        total: 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }),
      ...body,
    };
    orderStore.set(orderId, patchedOrder);
    return HttpResponse.json(patchedOrder, { status: 200 });
  }),
];

/**
 * Combine all handlers
 */
export const handlers = [...userHandlers, ...productHandlers, ...orderHandlers];
