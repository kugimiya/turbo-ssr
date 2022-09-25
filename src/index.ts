
import cluster from 'cluster';
import { ModuleBundler } from './lib/ModuleBundler';
import { Server } from './lib/Server';
import { printWebpackStats } from './lib/utils/printWebpackStats';
import { sleep } from './lib/utils/sleep';

type Config = {
  pagesPath: string;
  distPath: string;

  port: number;
  mode: 'production' | 'development' | 'none';

  enableCluster: boolean;
  clusterSize: number | 'auto';
};

const mainPrimary = async (config: Config) => {
  const { pagesPath, distPath, mode, enableCluster, clusterSize } = config;

  console.log('Building client bundles...');
  const bundler = new ModuleBundler(pagesPath, distPath, mode);
  const stats = await bundler.run();
  printWebpackStats(stats);

  if (enableCluster) {
    let threadsCount = (require('os').cpus().length) - 1;
  
    if (threadsCount === 0) {
      threadsCount = 1;
    }
  
    if (clusterSize !== 'auto') {
      threadsCount = clusterSize;
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
  } else {
    mainSecondary(config);
  }
};

const mainSecondary = async ({ pagesPath, distPath, port, mode }: Config) => {
  const server = new Server(pagesPath, distPath, port, mode);
  await server.bindRoutes();
  server.listen(() => {
    console.log(`Worker #${cluster?.worker?.id} listens port ${port}`);
  });
};

export const start = (config: Config) => {
  if (config.enableCluster) {
    if (cluster.isPrimary) {
      mainPrimary(config);
    } else {
      mainSecondary(config);
    }
  } else {
    mainPrimary(config);
  }
}
