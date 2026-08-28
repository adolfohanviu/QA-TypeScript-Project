/**
 * @feature {Feature} Contract
 * Schema-validated contract test for {METHOD} {/endpoint}
 *
 * The schema below MUST match the real response shape returned by the
 * corresponding handler in src/mocks/handlers.ts — read that handler first.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { z } from 'zod';
import { createApiClient, ApiClient } from '@/utils/api-client';
import { config } from '@/utils/config';

// Replace with the real shape from the matching handler in src/mocks/handlers.ts.
const {Entity}Schema = z.object({
  id: z.number(),
  // ...other real fields, with .optional() where the handler can omit them
});

describe('@api @contract {Entity} Contract', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = createApiClient(config.get('apiBaseUrl'));
  });

  it('should match the {Entity} schema', async () => {
    // @arrange
    // @act
    const response = await apiClient.get<unknown>('/{endpoint}');

    // @assert
    const result = {Entity}Schema.safeParse(response);
    expect(result.success).toBe(true);
  });
});
