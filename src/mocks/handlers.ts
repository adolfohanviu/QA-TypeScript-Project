/**
 * MSW Request Handlers
 * Mock handlers for all API endpoints in test environment
 */

import { rest } from 'msw';

const API_BASE_URL = 'https://jsonplaceholder.typicode.com';

/**
 * In-memory store for orders to persist state changes across requests
 */
const orderStore = new Map<number, any>([
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
      status: 'pending' as const,
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
      status: 'processing' as const,
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
      status: 'completed' as const,
      createdAt: '2024-01-17T09:15:00Z',
    },
  ],
]);

/**
 * Mock API handlers for users endpoints
 */
const userHandlers = [
  rest.get(`${API_BASE_URL}/users`, (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
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
      ])
    );
  }),

  rest.get(`${API_BASE_URL}/users/:id`, (req, res, ctx) => {
    const userId = parseInt(req.params.id as string);
    // Return 404 for non-existent users (ID > 11)
    if (userId > 11) {
      return res(
        ctx.status(404),
        ctx.json({ error: 'User not found' })
      );
    }
    return res(
      ctx.status(200),
      ctx.json({
        id: userId,
        username: `user${userId}`,
        email: `user${userId}@example.com`,
        firstName: `User${userId}`,
        lastName: 'Test',
        role: 'user' as const,
      })
    );
  }),

  rest.post(`${API_BASE_URL}/users`, (req, res, ctx) => {
    const body = req.body as any;
    return res(
      ctx.status(201),
      ctx.json({
        id: 11,
        username: body?.username || 'newuser',
        email: body?.email || 'newuser@example.com',
        firstName: body?.firstName || 'New',
        lastName: body?.lastName || 'User',
        role: 'user' as const,
      })
    );
  }),

  rest.put(`${API_BASE_URL}/users/:id`, (req, res, ctx) => {
    const body = req.body as any;
    const userId = 1;
    return res(
      ctx.status(200),
      ctx.json({
        id: userId,
        username: body?.username || `user${userId}`,
        email: body?.email || `user${userId}@example.com`,
        role: 'user' as const,
      })
    );
  }),
];

/**
 * Mock API handlers for products endpoints
 */
const productHandlers = [
  rest.get(`${API_BASE_URL}/products`, (req, res, ctx) => {
    const limit = parseInt(req.url.searchParams.get('limit') || '20');

    return res(
      ctx.status(200),
      ctx.json(
        Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
          id: i + 1,
          name: `Product ${i + 1}`,
          description: `This is product ${i + 1}`,
          price: Math.floor(Math.random() * 1000) + 10,
          image: `https://via.placeholder.com/200`,
          category: ['Electronics', 'Clothing', 'Books', 'Toys'][i % 4],
          inStock: i % 2 === 0,
        }))
      )
    );
  }),

  // Special routes MUST come before parameterized routes in MSW
  rest.get(`${API_BASE_URL}/products/search`, (req, res, ctx) => {
    const searchTerm = req.url.searchParams.get('q') || '';

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

    return res(
      ctx.status(200),
      ctx.json(results)
    );
  }),

  // Parameterized route comes AFTER specific routes
  rest.get(`${API_BASE_URL}/products/:id`, (req, res, ctx) => {
    const productId = parseInt(req.params.id as string);
    return res(
      ctx.status(200),
      ctx.json({
        id: productId,
        name: `Product ${productId}`,
        description: `This is product ${productId}`,
        price: 99.99,
        image: `https://via.placeholder.com/200`,
        category: 'Electronics',
        inStock: true,
      })
    );
  }),

  rest.patch(`${API_BASE_URL}/products/:id`, (req, res, ctx) => {
    const body = req.body as any;
    return res(
      ctx.status(200),
      ctx.json({
        id: 1,
        name: 'Updated Product',
        description: 'Updated description',
        price: body?.price || 99.99,
        inStock: body?.inStock !== undefined ? body.inStock : true,
        category: 'Electronics',
      })
    );
  }),
];

/**
 * Mock API handlers for orders endpoints
 */
const orderHandlers = [
  rest.get(`${API_BASE_URL}/orders`, (req, res, ctx) => {
    const statusFilter = req.url.searchParams.get('status');
    let orders = Array.from(orderStore.values());
    
    // Filter by status if provided
    if (statusFilter) {
      orders = orders.filter(order => order.status === statusFilter);
    }
    
    return res(
      ctx.status(200),
      ctx.json(orders)
    );
  }),

  rest.get(`${API_BASE_URL}/orders/:id`, (req, res, ctx) => {
    const orderId = parseInt(req.params.id as string);
    const order = orderStore.get(orderId) || {
      id: orderId,
      userId: 1,
      items: [],
      total: 0,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };
    return res(
      ctx.status(200),
      ctx.json(order)
    );
  }),

  rest.post(`${API_BASE_URL}/orders`, (req, res, ctx) => {
    const body = req.body as any;
    const newOrderId = Math.max(...Array.from(orderStore.keys()), 0) + 1;
    
    // Calculate total from items if not provided
    let total = body?.total || 0;
    if (!total && body?.items && body.items.length > 0) {
      total = body.items.reduce((sum: number, item: any) => {
        const itemPrice = (item.unitPrice || 50) * (item.quantity || 1);
        return sum + itemPrice;
      }, 0);
    }
    
    const newOrder = {
      id: newOrderId,
      userId: body?.userId,
      items: body?.items || [],
      total: total,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };
    orderStore.set(newOrderId, newOrder);
    return res(
      ctx.status(201),
      ctx.json(newOrder)
    );
  }),

  rest.put(`${API_BASE_URL}/orders/:id`, (req, res, ctx) => {
    const orderId = parseInt(req.params.id as string);
    const body = req.body as any;
    const existingOrder = orderStore.get(orderId);
    const updatedOrder = {
      ...(existingOrder || {
        id: orderId,
        userId: 1,
        items: [],
        total: 0,
        createdAt: new Date().toISOString(),
      }),
      status: body?.status || 'pending',
    };
    orderStore.set(orderId, updatedOrder);
    return res(
      ctx.status(200),
      ctx.json(updatedOrder)
    );
  }),

  rest.patch(`${API_BASE_URL}/orders/:id`, (req, res, ctx) => {
    const orderId = parseInt(req.params.id as string);
    const body = req.body as any;
    const existingOrder = orderStore.get(orderId);
    const patchedOrder = {
      ...(existingOrder || {
        id: orderId,
        userId: 1,
        items: [],
        total: 0,
        createdAt: new Date().toISOString(),
      }),
      ...body,
    };
    orderStore.set(orderId, patchedOrder);
    return res(
      ctx.status(200),
      ctx.json(patchedOrder)
    );
  }),
];

/**
 * Combine all handlers
 */
export const handlers = [...userHandlers, ...productHandlers, ...orderHandlers];
