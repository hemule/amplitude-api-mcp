import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { AmplitudeApiError, AmplitudeClient } from './client.js';

const config = { apiKey: 'key', secretKey: 'secret', baseUrl: 'https://amplitude.com' };
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('sends Basic auth header and parses JSON', async () => {
  let captured: { url: URL; init: RequestInit } | undefined;
  globalThis.fetch = (async (url: URL, init: RequestInit) => {
    captured = { url, init };
    return new Response(JSON.stringify({ ok: 1 }), { status: 200 });
  }) as typeof fetch;

  const client = new AmplitudeClient(config);
  const res = await client.request<{ ok: number }>({ method: 'GET', path: '/api/2/taxonomy/event' });

  assert.equal(res.ok, 1);
  const expected = `Basic ${Buffer.from('key:secret').toString('base64')}`;
  assert.equal((captured!.init.headers as Record<string, string>).Authorization, expected);
  assert.equal(captured!.url.toString(), 'https://amplitude.com/api/2/taxonomy/event');
});

test('retries on 429 then succeeds', async () => {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    if (calls === 1) return new Response('rate limited', { status: 429, headers: { 'retry-after': '0' } });
    return new Response(JSON.stringify({ done: true }), { status: 200 });
  }) as typeof fetch;

  const client = new AmplitudeClient(config);
  const res = await client.request<{ done: boolean }>({ method: 'GET', path: '/x' });

  assert.equal(calls, 2);
  assert.equal(res.done, true);
});

test('throws AmplitudeApiError on non-retryable status', async () => {
  globalThis.fetch = (async () =>
    new Response('bad request', { status: 400 })) as typeof fetch;

  const client = new AmplitudeClient(config);
  await assert.rejects(
    () => client.request({ method: 'POST', path: '/api/2/release', json: {} }),
    (err: unknown) => err instanceof AmplitudeApiError && err.status === 400,
  );
});
