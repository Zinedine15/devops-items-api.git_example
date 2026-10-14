import 'dotenv/config';
import { createApp } from './app';
import { closeDatabase, database } from './db';

const port = Number(process.env.PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

const app = createApp(database);
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Items API listening on port ${port}`);
});

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received. Shutting down gracefully...`);

  server.close(async (error) => {
    try {
      await closeDatabase();
      if (error) {
        console.error('HTTP server shutdown error:', error);
        process.exitCode = 1;
      }
    } catch (databaseError) {
      console.error('Database pool shutdown error:', databaseError);
      process.exitCode = 1;
    }
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
