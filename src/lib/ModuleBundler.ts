import path from 'path';
import fs from 'fs/promises';
import webpack, { Compiler } from 'webpack';
import { clientBundleWrapper } from './templates/clientBundleWrapper';

export class ModuleBundler {
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
    const modulePath = process.platform === "win32" 
      ? this.sourcePath.split('\\').join('/') // резолвинг es modules не работает с path delimiter виндовса
      : this.sourcePath;
    await fs.writeFile(wrapperOutputPath, clientBundleWrapper(modulePath));

    // Рендерим клиентский бандл
    return new Promise((resolve, reject) => {
      this.instance.run((runErr, stats) => {
        console.log(`Build client bundle for "${this.name}", ${stats?.compilation.endTime - stats?.compilation.startTime}ms`);
  
        if (runErr) {
          reject(runErr);
        }

        this.instance.close((closeErr) => {
          if (closeErr) {
            reject(closeErr)
          }

          resolve(stats);
        });
      });
    });
  }
}
