import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = `mcp_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const ALICE_ID = '507f1f77bcf86cd799439011';

async function isReachable() {
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
  try {
    await client.connect();
    await client.close();
    return true;
  } catch {
    return false;
  }
}

const HAS_DB = await isReachable();

test(
  'MongoDB end-to-end CRUD (requires reachable MongoDB)',
  { skip: !HAS_DB && `MongoDB not reachable at ${MONGODB_URI} — set MONGODB_URI or skip` },
  async (t) => {
    const mongo = new MongoClient(MONGODB_URI);
    await mongo.connect();
    const db = mongo.db(DB_NAME);
    await db.dropDatabase();

    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ['dist/index.js'],
      env: {
        MONGODB_URI,
        MONGODB_DATABASE: DB_NAME,
        PATH: process.env.PATH,
      },
    });
    const client = new Client({ name: 'e2e-test', version: '1.0.0' });
    await client.connect(transport);

    t.after(async () => {
      await client.close();
      await mongo.close();
    });

    const call = async (name, args) => JSON.parse((await client.callTool({ name, arguments: args })).content[0].text);

    const HEX = ALICE_ID;

    await t.test('listCollections on a fresh database is empty', async () => {
      assert.deepEqual(await call('listCollections', {}), []);
    });

    await t.test('insertOne writes documents to MongoDB', async () => {
      const r = await call('insertOne', {
        collection: 'users',
        document: { _id: HEX, name: 'Alice', email: 'alice@example.com', age: 30, tags: ['a', 'b'] },
      });
      assert.equal(r.acknowledged, true);
      assert.equal(r.insertedId, HEX);
      await call('insertOne', {
        collection: 'users',
        document: { name: 'Bob', email: 'bob@example.com', age: 25 },
      });
      assert.equal(await db.collection('users').countDocuments({}), 2);
    });

    await t.test('find applies filter, sort, and limit', async () => {
      const docs = await call('find', { collection: 'users', filter: { age: { $gte: 30 } }, sort: { age: -1 }, limit: 10 });
      assert.equal(docs.length, 1);
      assert.equal(docs[0].name, 'Alice');
      assert.equal(docs[0]._id, HEX);
      const partial = await call('find', { collection: 'users', filter: {}, limit: 1 });
      assert.equal(partial.length, 1);
    });

    await t.test('ObjectId strings are auto-converted in filters', async () => {
      const docs = await call('find', { collection: 'users', filter: { _id: HEX } });
      assert.equal(docs.length, 1);
      assert.equal(docs[0].email, 'alice@example.com');
    });

    await t.test('findOne returns a single document', async () => {
      const doc = await call('findOne', { collection: 'users', filter: { email: 'alice@example.com' } });
      assert.equal(doc.name, 'Alice');
      assert.equal(await call('findOne', { collection: 'users', filter: { email: 'nobody@example.com' } }), null);
    });

    await t.test('count and distinct', async () => {
      assert.equal((await call('count', { collection: 'users', filter: {} })).count, 2);
      const ages = await call('distinct', { collection: 'users', field: 'age' });
      assert.equal(ages.length, 2);
      assert.ok(ages.includes(25) && ages.includes(30));
    });

    await t.test('aggregate runs pipelines', async () => {
      const rows = await call('aggregate', {
        collection: 'users',
        pipeline: [{ $group: { _id: '$age', n: { $sum: 1 } } }, { $sort: { _id: 1 } }],
      });
      assert.deepEqual(rows, [
        { _id: 25, n: 1 },
        { _id: 30, n: 1 },
      ]);
    });

    await t.test('updateOne modifies and is idempotent on re-run', async () => {
      const r1 = await call('updateOne', { collection: 'users', filter: { email: 'bob@example.com' }, update: { $set: { status: 'active' } } });
      assert.equal(r1.modifiedCount, 1);
      const r2 = await call('updateOne', { collection: 'users', filter: { email: 'bob@example.com' }, update: { $set: { status: 'active' } } });
      assert.equal(r2.modifiedCount, 0);
      const doc = await call('findOne', { collection: 'users', filter: { email: 'bob@example.com' } });
      assert.equal(doc.status, 'active');
    });

    await t.test('getSchema discovers field types (ObjectId for _id)', async () => {
      const schema = await call('getSchema', { collection: 'users', sampleSize: 100 });
      assert.equal(schema.collection, 'users');
      for (const field of ['_id', 'name', 'email', 'age', 'status', 'tags']) {
        assert.ok(schema.fields[field], `missing field '${field}' in schema`);
      }
      assert.ok(schema.fields._id.types.includes('ObjectId'));
      assert.ok(schema.fields.age.types.includes('number'));
    });

    await t.test('deleteOne deletes and is idempotent on re-run', async () => {
      const r1 = await call('deleteOne', { collection: 'users', filter: { email: 'alice@example.com' } });
      assert.equal(r1.deletedCount, 1);
      assert.equal(await db.collection('users').countDocuments({ email: 'alice@example.com' }), 0);
      const r2 = await call('deleteOne', { collection: 'users', filter: { email: 'alice@example.com' } });
      assert.equal(r2.deletedCount, 0);
    });

    await t.test('bare documents are inserted (MongoDB is schemaless)', async () => {
      const r = await call('insertOne', { collection: 'users', document: { email: 'bare@example.com' } });
      assert.equal(r.acknowledged, true);
      assert.equal(await db.collection('users').countDocuments({}), 2);
    });

    await t.test('unknown tools are rejected', async () => {
      await assert.rejects(client.callTool({ name: 'doesNotExist', arguments: {} }), /Unknown tool/);
    });

    await t.test('data written by the server is visible directly in MongoDB', async () => {
      const doc = await db.collection('users').findOne({ email: 'bob@example.com' });
      assert.equal(doc.status, 'active');
      assert.equal(doc.age, 25);
    });

    await db.dropDatabase();
  }
);