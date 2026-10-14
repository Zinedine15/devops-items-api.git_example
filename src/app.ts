import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';

export interface Database {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<{ rows: T[] }>;
}

export interface Item extends Record<string, unknown> {
  id: number;
  name: string;
  description: string;
  created_at: Date | string;
}

const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2_000;

export function createApp(database: Database) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', async (_request, response) => {
    try {
      await database.query('SELECT 1');
      return response.status(200).json({ status: 'ok', database: 'connected' });
    } catch {
      return response.status(503).json({ status: 'error', database: 'disconnected' });
    }
  });

  app.post('/items', async (request, response) => {
    const body: unknown = request.body;
    const payload = typeof body === 'object' && body !== null
      ? body as Record<string, unknown>
      : {};

    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    const description = typeof payload.description === 'string'
      ? payload.description.trim()
      : '';
    const errors: Record<string, string> = {};

    if (!name) errors.name = 'Debe ser una cadena no vacía.';
    else if (name.length > MAX_NAME_LENGTH) errors.name = `No debe superar ${MAX_NAME_LENGTH} caracteres.`;

    if (!description) errors.description = 'Debe ser una cadena no vacía.';
    else if (description.length > MAX_DESCRIPTION_LENGTH) {
      errors.description = `No debe superar ${MAX_DESCRIPTION_LENGTH} caracteres.`;
    }

    if (Object.keys(errors).length > 0) {
      return response.status(400).json({ error: 'Validation error', details: errors });
    }

    const result = await database.query<Item>(
      'INSERT INTO items (name, description) VALUES ($1, $2) RETURNING id, name, description, created_at',
      [name, description],
    );

    return response.status(201).json(result.rows[0]);
  });

  app.get('/items', async (_request, response) => {
    const result = await database.query<Item>(
      'SELECT id, name, description, created_at FROM items ORDER BY id ASC',
    );
    return response.status(200).json(result.rows);
  });

  const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
    if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
      return response.status(400).json({ error: 'Invalid JSON body' });
    }

    // Se evita devolver mensajes internos o detalles de la base de datos al cliente.
    console.error('Unhandled request error:', error);
    return response.status(500).json({ error: 'Internal server error' });
  };
  app.use(errorHandler);

  return app;
}
