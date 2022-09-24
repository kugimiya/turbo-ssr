import path from 'path';
import webpack, { Compiler } from 'webpack';

export class Webpack {
  instance: Compiler;

  constructor(private name: string, private sourcePath: string, private mode: 'production' | 'development') {
    this.instance = webpack({
      name,
      mode,
      entry: sourcePath,
      output: {
        path: path.resolve(__dirname, "dist"),
        filename: `${name}.js`,
        library: {
          type: 'umd',
        },
      },
    });
  }

  public run() {
    this.instance.run((runErr, stats) => {
      console.log(`Build client bundle for "${this.name}", ${stats?.compilation.endTime - stats?.compilation.startTime}ms`);

      if (runErr) {
        console.log({ runErr });
      }

      this.instance.close((closeErr) => {
        if (closeErr) {
          console.log({ closeErr });
        }
      });
    });
  }
}
