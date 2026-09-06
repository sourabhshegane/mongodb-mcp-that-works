#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { z } from 'zod';

// Tool schemas
const FindToolSchema = z.object({
  collection: z.string().describe('Collection name'),
  filter: z.record(z.any()).optional().default({}).describe('MongoDB filter query'),
  projection: z.record(z.any()).optional().describe('Fields to include/exclude'),
  sort: z.record(z.any()).optional().describe('Sort specification'),
  limit: z.number().optional().default(10).describe('Maximum documents to return'),
  skip: z.number().optional().default(0).describe('Number of documents to skip'),
});

const FindOneToolSchema = z.object({
  collection: z.string().describe('Collection name'),
  filter: z.record(z.any()).optional().default({}).describe('MongoDB filter query'),
  projection: z.record(z.any()).optional().describe('Fields to include/exclude'),
});

const AggregateToolSchema = z.object({
  collection: z.string().describe('Collection name'),
  pipeline: z.array(z.record(z.any())).describe('MongoDB aggregation pipeline'),
  limit: z.number().optional().describe('Maximum documents to return'),
});

const CountToolSchema = z.object({
  collection: z.string().describe('Collection name'),
  filter: z.record(z.any()).optional().default({}).describe('MongoDB filter query'),
});

const DistinctToolSchema = z.object({
  collection: z.string().describe('Collection name'),
  field: z.string().describe('Field to get distinct values for'),
  filter: z.record(z.any()).optional().default({}).describe('MongoDB filter query'),
});

const ListCollectionsToolSchema = z.object({
  filter: z.record(z.any()).optional().default({}).describe('Optional filter for collections'),
});

const InsertOneToolSchema = z.object({
  collection: z.string().describe('Collection name'),
  document: z.record(z.any()).describe('Document to insert'),
});

const UpdateOneToolSchema = z.object({
  collection: z.string().describe('Collection name'),
  filter: z.record(z.any()).describe('Filter to find document'),
  update: z.record(z.any()).describe('Update operations'),
  upsert: z.boolean().optional().default(false).describe('Create if not exists'),
});

const DeleteOneToolSchema = z.object({
  collection: z.string().describe('Collection name'),
  filter: z.record(z.any()).describe('Filter to find document'),
});

const GetSchemaToolSchema = z.object({
  collection: z.string().describe('Collection name'),
  sampleSize: z.number().optional().default(100).describe('Number of documents to sample for schema analysis'),
});

class MongoDBMCPServer {
  private server: Server;
  private mongoClient: MongoClient | null = null;
  private db: Db | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'mongodb-mcp-that-works',
        version: '0.1.8',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private async connect(): Promise<void> {
    if (this.mongoClient && this.db) return;

    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DATABASE;

    if (!uri) {
      throw new McpError(ErrorCode.InternalError, 'MONGODB_URI environment variable is required');
    }

    try {
      this.mongoClient = new MongoClient(uri);
      await this.mongoClient.connect();
      this.db = this.mongoClient.db(dbName);
      console.error(`Connected to MongoDB: ${dbName || 'default database'}`);
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to connect to MongoDB: ${error}`);
    }
  }

  private async ensureConnected(): Promise<Db> {
    if (!this.db) {
      await this.connect();
    }
    return this.db!;
  }

  private convertToObjectIds(obj: any): any {
    if (!obj) return obj;

    if (typeof obj === 'string' && ObjectId.isValid(obj) && obj.length === 24) {
      return new ObjectId(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.convertToObjectIds(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const converted: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key === '_id' || key.endsWith('_id') || key.endsWith('Id') || key.endsWith('_ids') || key.endsWith('Ids')) {
          if (typeof value === 'string' && ObjectId.isValid(value)) {
            converted[key] = new ObjectId(value);
          } else if (Array.isArray(value)) {
            converted[key] = value.map((v) => (typeof v === 'string' && ObjectId.isValid(v) ? new ObjectId(v) : v));
          } else if (typeof value === 'object' && value !== null && '$in' in value) {
            converted[key] = {
              $in: Array.isArray(value.$in)
                ? value.$in.map((v) => (typeof v === 'string' && ObjectId.isValid(v) ? new ObjectId(v) : v))
                : value.$in,
            };
          } else {
            converted[key] = this.convertToObjectIds(value);
          }
        } else {
          converted[key] = this.convertToObjectIds(value);
        }
      }
      return converted;
    }

    return obj;
  }

  private setupHandlers(): void {
    console.error('[MongoDB MCP] Setting up handlers...');
    
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error('[MongoDB MCP] ListToolsRequest received');
      return {
        tools: [
        {
          name: 'find',
          description: 'Find documents in a MongoDB collection',
          annotations: {
            readOnlyHint: true,
            idempotentHint: true,
            destructiveHint: false,
          },
          inputSchema: {
            type: 'object',
            properties: {
              collection: { type: 'string', description: 'Collection name' },
              filter: { type: 'object', description: 'MongoDB filter query' },
              projection: { type: 'object', description: 'Fields to include/exclude' },
              sort: { type: 'object', description: 'Sort specification' },
              limit: { type: 'number', description: 'Maximum documents to return', default: 10 },
              skip: { type: 'number', description: 'Number of documents to skip', default: 0 },
            },
            required: ['collection'],
          },
        },
        {
          name: 'findOne',
          description: 'Find a single document in a MongoDB collection',
          annotations: {
            readOnlyHint: true,
            idempotentHint: true,
            destructiveHint: false,
          },
          inputSchema: {
            type: 'object',
            properties: {
              collection: { type: 'string', description: 'Collection name' },
              filter: { type: 'object', description: 'MongoDB filter query' },
              projection: { type: 'object', description: 'Fields to include/exclude' },
            },
            required: ['collection'],
          },
        },
        {
          name: 'aggregate',
          description: 'Run an aggregation pipeline on a MongoDB collection',
          annotations: {
            readOnlyHint: true,
            idempotentHint: true,
            destructiveHint: false,
          },
          inputSchema: {
            type: 'object',
            properties: {
              collection: { type: 'string', description: 'Collection name' },
              pipeline: { type: 'array', description: 'MongoDB aggregation pipeline' },
              limit: { type: 'number', description: 'Maximum documents to return' },
            },
            required: ['collection', 'pipeline'],
          },
        },
        {
          name: 'count',
          description: 'Count documents in a MongoDB collection',
          annotations: {
            readOnlyHint: true,
            idempotentHint: true,
            destructiveHint: false,
          },
          inputSchema: {
            type: 'object',
            properties: {
              collection: { type: 'string', description: 'Collection name' },
              filter: { type: 'object', description: 'MongoDB filter query' },
            },
            required: ['collection'],
          },
        },
        {
          name: 'distinct',
          description: 'Get distinct values for a field in a MongoDB collection',
          annotations: {
            readOnlyHint: true,
            idempotentHint: true,
            destructiveHint: false,
          },
          inputSchema: {
            type: 'object',
            properties: {
              collection: { type: 'string', description: 'Collection name' },
              field: { type: 'string', description: 'Field to get distinct values for' },
              filter: { type: 'object', description: 'MongoDB filter query' },
            },
            required: ['collection', 'field'],
          },
        },
        {
          name: 'listCollections',
          description: 'List all collections in the database',
          annotations: {
            readOnlyHint: true,
            idempotentHint: true,
            destructiveHint: false,
          },
          inputSchema: {
            type: 'object',
            properties: {
              filter: { type: 'object', description: 'Optional filter for collections' },
            },
          },
        },
        {
          name: 'insertOne',
          description: 'Insert a single document into a MongoDB collection',
          annotations: {
            readOnlyHint: false,
            idempotentHint: false,
            destructiveHint: false,
          },
          inputSchema: {
            type: 'object',
            properties: {
              collection: { type: 'string', description: 'Collection name' },
              document: { type: 'object', description: 'Document to insert' },
            },
            required: ['collection', 'document'],
          },
        },
        {
          name: 'updateOne',
          description: 'Update a single document in a MongoDB collection',
          annotations: {
            readOnlyHint: false,
            idempotentHint: false,
            destructiveHint: true,
          },
          inputSchema: {
            type: 'object',
            properties: {
              collection: { type: 'string', description: 'Collection name' },
              filter: { type: 'object', description: 'Filter to find document' },
              update: { type: 'object', description: 'Update operations' },
              upsert: { type: 'boolean', description: 'Create if not exists', default: false },
            },
            required: ['collection', 'filter', 'update'],
          },
        },
        {
          name: 'deleteOne',
          description: 'Delete a single document from a MongoDB collection',
          annotations: {
            readOnlyHint: false,
            idempotentHint: true,
            destructiveHint: true,
          },
          inputSchema: {
            type: 'object',
            properties: {
              collection: { type: 'string', description: 'Collection name' },
              filter: { type: 'object', description: 'Filter to find document' },
            },
            required: ['collection', 'filter'],
          },
        },
        {
          name: 'getSchema',
          description: 'Analyze collection structure and return field names with types',
          annotations: {
            readOnlyHint: true,
            idempotentHint: true,
            destructiveHint: false,
          },
          inputSchema: {
            type: 'object',
            properties: {
              collection: { type: 'string', description: 'Collection name' },
              sampleSize: { type: 'number', description: 'Number of documents to sample', default: 100 },
            },
            required: ['collection'],
          },
        },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      console.error('[MongoDB MCP] CallToolRequest received:', request.params.name);
      const { name, arguments: args } = request.params;

      try {
        const db = await this.ensureConnected();

        switch (name) {
          case 'find': {
            const params = FindToolSchema.parse(args);
            const collection = db.collection(params.collection);

            // Convert string IDs to ObjectIds
            const filter = this.convertToObjectIds(params.filter);

            let query = collection.find(filter);

            if (params.projection) {
              query = query.project(params.projection);
            }

            if (params.sort) {
              query = query.sort(params.sort);
            }

            const results = await query.skip(params.skip).limit(params.limit).toArray();

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(results, null, 2),
                },
              ],
            };
          }

          case 'findOne': {
            const params = FindOneToolSchema.parse(args);
            const collection = db.collection(params.collection);

            const filter = this.convertToObjectIds(params.filter);
            const result = await collection.findOne(filter, {
              projection: params.projection,
            });

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'aggregate': {
            const params = AggregateToolSchema.parse(args);
            const collection = db.collection(params.collection);

            // Convert ObjectIds in pipeline
            const pipeline = this.convertToObjectIds(params.pipeline);

            let aggregation = collection.aggregate(pipeline);

            if (params.limit) {
              aggregation = aggregation.limit(params.limit);
            }

            const results = await aggregation.toArray();

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(results, null, 2),
                },
              ],
            };
          }

          case 'count': {
            const params = CountToolSchema.parse(args);
            const collection = db.collection(params.collection);

            const filter = this.convertToObjectIds(params.filter);
            const count = await collection.countDocuments(filter);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ count }, null, 2),
                },
              ],
            };
          }

          case 'distinct': {
            const params = DistinctToolSchema.parse(args);
            const collection = db.collection(params.collection);

            const filter = this.convertToObjectIds(params.filter);
            const values = await collection.distinct(params.field, filter);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(values, null, 2),
                },
              ],
            };
          }

          case 'listCollections': {
            const params = ListCollectionsToolSchema.parse(args);
            const collections = await db.listCollections(params.filter).toArray();

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(collections, null, 2),
                },
              ],
            };
          }

          case 'insertOne': {
            const params = InsertOneToolSchema.parse(args);
            const collection = db.collection(params.collection);

            const document = this.convertToObjectIds(params.document);
            const result = await collection.insertOne(document);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      acknowledged: result.acknowledged,
                      insertedId: result.insertedId,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'updateOne': {
            const params = UpdateOneToolSchema.parse(args);
            const collection = db.collection(params.collection);

            const filter = this.convertToObjectIds(params.filter);
            const update = this.convertToObjectIds(params.update);

            const result = await collection.updateOne(filter, update, {
              upsert: params.upsert,
            });

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      acknowledged: result.acknowledged,
                      matchedCount: result.matchedCount,
                      modifiedCount: result.modifiedCount,
                      upsertedId: result.upsertedId,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'deleteOne': {
            const params = DeleteOneToolSchema.parse(args);
            const collection = db.collection(params.collection);

            const filter = this.convertToObjectIds(params.filter);
            const result = await collection.deleteOne(filter);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      acknowledged: result.acknowledged,
                      deletedCount: result.deletedCount,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'getSchema': {
            const params = GetSchemaToolSchema.parse(args);
            const collection = db.collection(params.collection);

            // Sample documents to analyze schema
            const samples = await collection.find({}).limit(params.sampleSize).toArray();
            
            if (samples.length === 0) {
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({ message: 'No documents found in collection', fields: {} }, null, 2),
                  },
                ],
              };
            }

            // Analyze field types across all samples
            const fieldInfo: Record<string, { types: Set<string>; examples: any[]; count: number }> = {};

            const analyzeObject = (obj: any, prefix = '') => {
              for (const [key, value] of Object.entries(obj)) {
                const fieldPath = prefix ? `${prefix}.${key}` : key;
                
                if (!fieldInfo[fieldPath]) {
                  fieldInfo[fieldPath] = { types: new Set(), examples: [], count: 0 };
                }
                
                fieldInfo[fieldPath].count++;
                
                const type = Array.isArray(value) ? 'array' : 
                            value === null ? 'null' : 
                            value instanceof Date ? 'date' :
                            value instanceof ObjectId ? 'ObjectId' :
                            typeof value;
                
                fieldInfo[fieldPath].types.add(type);
                
                // Store up to 3 examples
                if (fieldInfo[fieldPath].examples.length < 3 && value !== null) {
                  fieldInfo[fieldPath].examples.push(value);
                }
                
                // Recursively analyze nested objects
                if (type === 'object' && value !== null) {
                  analyzeObject(value, fieldPath);
                }
              }
            };

            // Analyze all sample documents
            samples.forEach(doc => analyzeObject(doc));

            // Convert Set to Array and format the output
            const schema = Object.entries(fieldInfo).reduce((acc, [field, info]) => {
              acc[field] = {
                types: Array.from(info.types),
                examples: info.examples,
                frequency: `${info.count}/${samples.length}`,
                percentage: Math.round((info.count / samples.length) * 100)
              };
              return acc;
            }, {} as Record<string, any>);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    collection: params.collection,
                    sampleSize: samples.length,
                    fields: schema,
                    summary: {
                      totalFields: Object.keys(schema).length,
                      totalDocuments: samples.length
                    }
                  }, null, 2),
                },
              ],
            };
          }

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Invalid parameters: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
          );
        }
        throw error;
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MongoDB MCP server running on stdio');
  }

  async cleanup(): Promise<void> {
    if (this.mongoClient) {
      await this.mongoClient.close();
      console.error('Disconnected from MongoDB');
    }
  }
}

console.error('[MongoDB MCP] Starting server...');
const server = new MongoDBMCPServer();
server.run().catch((error) => {
  console.error('[MongoDB MCP] Server error:', error);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.error('[MongoDB MCP] Received SIGINT, cleaning up...');
  await server.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('[MongoDB MCP] Received SIGTERM, cleaning up...');
  await server.cleanup();
  process.exit(0);
});
