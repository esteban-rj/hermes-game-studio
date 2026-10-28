import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveModel } from '../scripts/resolve-model.mjs';

test('los seis perfiles conservan suscripción y las rutas elegidas', () => {
  const expected = { atlas: 'gpt-6.1-sol', pixel: 'gpt-6.1-sol', prisma: 'gpt-6.1-terra', ux: 'gpt-6.1-terra', nodo: 'gpt-6-luna', lupa: 'gpt-6.1-sol' };
  for (const [agent, model] of Object.entries(expected)) {
    const route = resolveModel({ agent });
    assert.equal(route.model, model);
    assert.equal(route.provider, 'openai-codex');
    assert.equal(route.automaticFallback, false);
    assert.equal(route.accessVerified, false);
  }
});

test('rechaza Astra, nombres desconocidos y proveedores de API', () => {
  for (const model of ['gpt-6-astra', 'gpt-6-astra-2026-10-28', 'otro-modelo']) {
    assert.throws(() => resolveModel({ agent: 'atlas', model }), /Modelo fuera/);
  }
  for (const provider of ['openai', 'openai-api', 'openrouter', 'custom']) {
    assert.throws(() => resolveModel({ agent: 'pixel', provider }), /Sólo se permite/);
  }
  assert.throws(() => resolveModel({ agent: 'desconocido' }), /Agente desconocido/);
});

test('permite escalar un rol a Sol sin cambiar la autenticación', () => {
  const route = resolveModel({ agent: 'nodo', model: 'gpt-6.1-sol' });
  assert.equal(route.model, 'gpt-6.1-sol');
  assert.equal(route.provider, 'openai-codex');
});
