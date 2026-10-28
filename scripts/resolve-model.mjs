// Resuelve la política elegida sin arrancar Hermes/Codex ni hacer inferencia.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const policy = JSON.parse(await readFile(new URL('../config/model-routing.json', import.meta.url), 'utf8'));
const approvedModels = new Set(['gpt-6-luna', 'gpt-6.1-terra', 'gpt-6.1-sol']);

export function resolveModel({ agent, provider, model } = {}) {
  if (!Object.hasOwn(policy.routes, agent)) throw new Error('Agente desconocido.');
  const route = policy.routes[agent];
  const selection = { ...route, provider: provider || route.provider, model: model || route.model };
  if (policy.billing.mode !== 'chatgpt-subscription' || policy.billing.allowApiBilling !== false ||
      policy.maximumModel !== 'gpt-6.1-sol' || policy.escalationModel !== 'gpt-6.1-sol' ||
      policy.automaticFallback !== false || policy.allowedModels.some(value => !approvedModels.has(value))) {
    throw new Error('La política debe conservar suscripción exclusiva y Sol 6.1 como máximo.');
  }
  if (selection.provider !== 'openai-codex' || !policy.allowedProviders.includes(selection.provider)) {
    throw new Error('Sólo se permite la suscripción ChatGPT/Codex; API y otros proveedores deshabilitados.');
  }
  if (!approvedModels.has(selection.model) || !policy.allowedModels.includes(selection.model)) {
    throw new Error('Modelo fuera de la lista autorizada: Luna, Terra 6.1 o Sol 6.1.');
  }
  if (!['low', 'medium', 'high'].includes(selection.reasoningEffort)) throw new Error('Esfuerzo de razonamiento inválido.');
  return { ...selection, billingMode: policy.billing.mode, automaticFallback: false, accessVerified: false };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    let input = '';
    for await (const chunk of process.stdin) input += chunk;
    console.log(JSON.stringify(resolveModel(JSON.parse(input))));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
