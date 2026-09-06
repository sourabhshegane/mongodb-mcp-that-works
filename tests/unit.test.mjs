import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version: pkgVersion } = require('../package.json');

const EXPECTED_TOOLS = [
  'find',
  'findOne',
  'aggregate',
  'count',
  'distinct',
  'listCollections',
  'insertOne',
  'updateOne',
  'deleteOne',
  'getSchema',
];

function spawnServer(t) {
  const child = spawn(process.execPath, ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { PATH: process.env.PATH },
  });
  const pending = new Map();
  let buffer = '';
  let nextId = 1;

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    buffer += chunk;
    let i;
    while ((i = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 1);
      if (!line) continue;
      const msg = JSON.parse(line);
      if (msg.id !== undefined && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(`[${msg.error.code}] ${msg.error.message}`));
        else resolve(msg.result);
      }
    }
  });

  const request = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });

  t.after(() => child.kill());
  return { request };
}

const INIT = {
  protocolVersion: '2025-03-26',
  capabilities: {},
  clientInfo: { name: 'unit-test', version: '0.0.0' },
};

test('negotiates protocol and reports server version', async (t) => {
  const server = spawnServer(t);
  const res = await server.request('initialize', INIT);
  assert.equal(res.protocolVersion, '2025-03-26');
  assert.equal(res.serverInfo.name, 'mongodb-mcp-that-works');
  assert.equal(res.serverInfo.version, pkgVersion);
});

test('exposes exactly the 10 expected tools', async (t) => {
  const server = spawnServer(t);
  await server.request('initialize', INIT);
  const { tools } = await server.request('tools/list');
  const names = tools.map((tool) => tool.name).sort();
  assert.deepEqual(names, [...EXPECTED_TOOLS].sort());
  for (const tool of tools) {
    assert.equal(typeof tool.description, 'string');
    assert.equal(tool.inputSchema.type, 'object');
  }
});

test('annotates read tools as readOnly', async (t) => {
  const server = spawnServer(t);
  await server.request('initialize', INIT);
  const { tools } = await server.request('tools/list');
  for (const name of ['find', 'findOne', 'count', 'distinct', 'listCollections', 'getSchema']) {
    const tool = tools.find((x) => x.name === name);
    assert.equal(tool.annotations.readOnlyHint, true, `${name} should be readOnly`);
    assert.equal(tool.annotations.destructiveHint, false, `${name} destructive`);
  }
});

test('annotates write tools as non-readOnly with destructive/idempotent hints', async (t) => {
  const server = spawnServer(t);
  await server.request('initialize', INIT);
  const { tools } = await server.request('tools/list');
  const byName = Object.fromEntries(tools.map((x) => [x.name, x.annotations]));
  assert.equal(byName.insertOne.readOnlyHint, false);
  assert.equal(byName.insertOne.destructiveHint, false);
  assert.equal(byName.updateOne.readOnlyHint, false);
  assert.equal(byName.updateOne.destructiveHint, true);
  assert.equal(byName.updateOne.idempotentHint, false);
  assert.equal(byName.deleteOne.readOnlyHint, false);
  assert.equal(byName.deleteOne.destructiveHint, true);
  assert.equal(byName.deleteOne.idempotentHint, true);
});

test('requires MONGODB_URI before tool calls', async (t) => {
  const server = spawnServer(t);
  await server.request('initialize', INIT);
  await assert.rejects(
    server.request('tools/call', { name: 'find', arguments: { collection: 'users' } }),
    /MONGODB_URI environment variable is required/
  );
});