/**
 * @feature API Client Resilience
 * Fault-injection tests for ApiClient's retry/timeout behavior.
 *
 * Runs against MockServer (mocks/mockserver isn't the right tool - it can't
 * be told to fail on demand the way a real dependency-injected mock server
 * can), not the live jsonplaceholder API used elsewhere in this suite.
 * Start it first:
 *   docker compose --profile mock up -d api   (or: docker run -p 1080:1080 mockserver/mockserver)
 *
 * The whole suite is skipped (not failed) if MockServer isn't reachable -
 * checked synchronously via execSync before Jest collects any tests, so
 * `describe.skip` actually applies instead of every test failing on a
 * connection error.
 */
import { execSync } from 'child_process';
import { describe, it, expect, beforeEach } from '@jest/globals';
import axios from 'axios';
import { createApiClient, ApiClient } from '@/utils/api-client';

const MOCKSERVER_URL = process.env.MOCKSERVER_URL ?? 'http://localhost:1080';

function isMockServerReachable(): boolean {
  try {
    execSync(`curl -sf -X PUT ${MOCKSERVER_URL}/mockserver/status`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const mockServerAvailable = isMockServerReachable();
const describeIfAvailable = mockServerAvailable ? describe : describe.skip;

async function putExpectation(expectation: Record<string, unknown>): Promise<void> {
  await axios.put(`${MOCKSERVER_URL}/mockserver/expectation`, expectation);
}

describeIfAvailable('@resilience ApiClient retry/timeout behavior', () => {
  let client: ApiClient;

  beforeEach(async () => {
    await axios.put(`${MOCKSERVER_URL}/mockserver/reset`);
    client = createApiClient(MOCKSERVER_URL);
  });

  it('retries through transient failures then succeeds', async () => {
    // @arrange - fails twice (503), then recovers
    await putExpectation({
      httpRequest: { method: 'GET', path: '/flaky-orders' },
      httpResponse: { statusCode: 503, body: '{"error":"temporarily unavailable"}' },
      times: { remainingTimes: 2 },
    });
    await putExpectation({
      httpRequest: { method: 'GET', path: '/flaky-orders' },
      httpResponse: { statusCode: 200, body: '[{"id":1,"status":"pending"}]' },
    });

    // @act
    const orders = await client.get<Array<{ id: number }>>('/flaky-orders');

    // @assert
    expect(orders).toHaveLength(1);
  });

  it('retries through a dropped connection then succeeds', async () => {
    // @arrange - connection reset once, then recovers
    await putExpectation({
      httpRequest: { method: 'GET', path: '/dropped-orders' },
      httpError: { dropConnection: true },
      times: { remainingTimes: 1 },
    });
    await putExpectation({
      httpRequest: { method: 'GET', path: '/dropped-orders' },
      httpResponse: { statusCode: 200, body: '[]' },
    });

    // @act
    const orders = await client.get<unknown[]>('/dropped-orders');

    // @assert
    expect(orders).toEqual([]);
  });

  it('gives up after max retries on a persistent failure', async () => {
    // @arrange - always fails
    await putExpectation({
      httpRequest: { method: 'GET', path: '/broken-orders' },
      httpResponse: { statusCode: 503, body: '{"error":"temporarily unavailable"}' },
    });

    // @act & @assert
    await expect(client.get('/broken-orders')).rejects.toMatchObject({ statusCode: 503 });
  });

  it('times out instead of hanging on a slow response', async () => {
    // @arrange - delays past the client timeout
    await putExpectation({
      httpRequest: { method: 'GET', path: '/slow-orders' },
      httpResponse: { statusCode: 200, body: '[]', delay: { timeUnit: 'SECONDS', value: 3 } },
    });
    client.maxRetries = 0;
    client.setTimeout(1000);

    // @act & @assert
    await expect(client.get('/slow-orders')).rejects.toThrow();
  });
});

if (!mockServerAvailable) {
  console.warn(
    `@resilience suite skipped - MockServer not reachable at ${MOCKSERVER_URL}. ` +
      'Start it with `docker compose --profile mock up -d api`.',
  );
}
