import { buildApp } from './app';

const app = buildApp({ logger: true });
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

async function start() {
  try {
    await app.listen({ port, host });
    app.log.info(`Server listening at http://${host}:${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
