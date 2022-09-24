
import cluster from 'cluster';
import path from 'path';
import { Bundler } from './lib/Bundler';
import { Server } from './lib/Server';
import { sleep } from './lib/utils/sleep';

const pagesPath = path.join(process.cwd(), 'src', 'pages');
const port = 3000;

const mainPrimary = async () => {
  await Bundler(pagesPath);

  let threadsCount = (require('os').cpus().length) - 1;
  if (threadsCount === 0) {
    threadsCount = 1;
  }
  
  cluster.on('online', (_) => console.log(`Spawn worker (#${_.id}, pid ${_.process.pid})`));
  cluster.on('exit', (_) => {
    console.log(`Worker exited (${_.id})`);
    cluster.fork();
  });

  for (let i = 0; i < threadsCount; i++) {
    cluster.fork();
    await sleep(25);
  }
};

const mainSecondary = async () => {
  const server = new Server(pagesPath, port);
  await server.bindRoutes();
  server.listen(() => {
    console.log(`Worker #${cluster?.worker?.id} listens port ${port}`);
  });
};

if (cluster.isPrimary) {
  mainPrimary();
} else {
  mainSecondary();
}
