
import cluster from 'cluster';
import path from 'path';
import { Server } from './lib/Server';

const pagesPath = path.join(process.cwd(), 'src', 'pages');
const port = 3000;

if (cluster.isPrimary) {
  const server = new Server(pagesPath, port);
  server.buildJs();

  let threadsCount = (require('os').cpus().length) - 1;
  if (threadsCount === 0) {
    threadsCount = 1;
  }

  for (let i = 0; i < threadsCount; i++) {
    cluster.fork();
  }

  cluster.on('online', (_) => console.log(`Spawn worker (${_.id}, ${_.process.pid})`));
  cluster.on('exit', (_) => {
    console.log(`Worker exited (${_.id})`);
    cluster.fork();
  });
} else {
  const server = new Server(pagesPath, port);
  server.bindRoutes().then(() => server.listen()).catch(console.error);
}
