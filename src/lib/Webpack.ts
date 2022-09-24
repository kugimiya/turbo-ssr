import path from 'path';
import fs from 'fs/promises';
import webpack, { Compiler } from 'webpack';
import { clientWrapper } from './const';

export class Webpack {
  instance: Compiler;

  constructor(private name: string, private sourcePath: string, private mode: 'production' | 'development' | 'none') {
    this.instance = webpack({
      name,
      mode,
      entry: path.resolve(__dirname, 'dist', 'wrappers', `${name}.tsx`),
      target: 'web',
      resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx'],
      },
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: '/node_modules/'
          }
        ]
      },
      output: {
        path: path.resolve(__dirname, 'dist', 'scripts'),
        filename: `${name}.js`,
        library: {
          type: 'umd',
        },
      },
    });
  }

  public async run() {
    // Готовим обёртку
    const wrapperOutputPath = path.resolve(__dirname, 'dist', 'wrappers', `${this.name}.tsx`);
    await fs.writeFile(wrapperOutputPath, clientWrapper(this.sourcePath));

    // Рендерим
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
