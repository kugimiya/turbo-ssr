import path from 'path';
import fs from 'fs/promises';
import webpack, { Compiler } from 'webpack';
import { clientBundleWrapper } from './templates/clientBundleWrapper';
import { printWebpackStats } from './utils/printWebpackStats';

export class ModuleBundler {
  private allowShared = false;

  constructor(
    private pagesDirPath: string, 
    private distPath: string, 
    private destDir: string,
    private mode: 'production' | 'development' | 'none',
  ) {}

  private get outputPath(): string {
    return path.resolve(this.distPath, this.destDir);
  }

  private getModulePath(sourcePath: string): string {
    return process.platform === "win32" 
      ? sourcePath.split('\\').join('/') // резолвинг es modules не работает с path delimiter виндовса
      : sourcePath;
  }

  private getWrapperPath(name: string): string {
    return path.resolve(this.distPath, 'wrappers', `${name}.tsx`);
  }

  private getInstance(entries: Record<string, unknown>): Compiler {
    const webpackCallback = this.mode === 'production' 
      ? undefined 
      : (_err: unknown, stats: webpack.Stats | undefined) => {
        if (_err) {
          console.log('Webpack Error: ', _err);
        }
        printWebpackStats(stats);
      };

    return webpack({
      name: 'config',
      cache: true,
      mode: this.mode,
      devtool: this.mode === 'production' ? false : 'inline-source-map',
      watch: this.mode !== 'production',
      entry: {
        ...(this.allowShared ? { shared: ['react', 'react-dom/client'] } : {}),
        ...entries as any
      },
      target: ['web', 'es5'],
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
        path: this.outputPath,
        filename: `[name].js`,
        library: {
          type: 'commonjs',
        },
      },
      optimization: {
        mergeDuplicateChunks: true,
        nodeEnv: this.mode,
        minimize: this.mode === 'production',
      }
    }, webpackCallback);
  }

  public async run(): Promise<webpack.Stats | undefined> {
    const entries = await fs.readdir(this.pagesDirPath);
    const entriesMap: Record<string, unknown> = {};

    for (let fileName of entries) {
      // Готовим обёртку
      const [name] = fileName.split('.tsx');
      entriesMap[name] = {
        import: this.getWrapperPath(name),
        dependOn: this.allowShared ? 'shared' : undefined,
      };

      await fs.writeFile(
        this.getWrapperPath(name), 
        clientBundleWrapper(this.getModulePath(`${this.pagesDirPath}/${name}`))
      );
    }

    // Рендерим клиентский бандл
    return new Promise((resolve, reject) => {
      const instance = this.getInstance(entriesMap);

      if (this.mode === 'production') {
        instance.run((runErr, stats) => {
          console.log(`Builded client bundles, ${stats?.compilation.endTime - stats?.compilation.startTime}ms`);
    
          if (runErr) {
            reject(runErr);
          }

          instance.close((closeErr) => {
            if (closeErr) {
              reject(closeErr)
            }

            resolve(stats as webpack.Stats);
          });
        });
      } else {
        resolve(undefined);
      }
    });
  }
}
