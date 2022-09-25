import webpack from 'webpack';

export const printWebpackStats = (stats: webpack.Stats | undefined) => {
  if (stats) {
    if (stats.hasErrors()) {
      console.log(stats.compilation.errors);
      return;
    } else {
      console.log('Builded bundles info: ');

      const entries = [...stats.compilation.assetsInfo.entries()];
      entries.map(([key, data]) => {
        console.log(`  Chunk '${key}', size: ${Number(data?.size) / 1000}kB`);
      });
    }
  }
}
