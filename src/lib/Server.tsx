import * as ReactDOMServer from 'react-dom/server';
import React from 'react';
import fs from 'fs/promises';
import express, { Express, RequestHandler } from 'express';
import { baseTemplate } from './const';
import { Webpack } from './Webpack';
import path from 'path';

export class Server {
  private router: Express;

  constructor(
    private pagesDirPath: string,
    private listenPort: number,
  ) {
    this.router = express();
  }

  public listen() {
    this.router.listen(this.listenPort, () => console.log(`Listen started at ${this.listenPort}`));
  }

  public async buildJs() {
    const pages = await fs.readdir(this.pagesDirPath);

    for (let pageFName of pages) {
      const [route] = pageFName.split('.tsx');

      const builder = new Webpack(route, `${this.pagesDirPath}/${pageFName}`, 'development');
      builder.run();
    }
  }

  public async bindRoutes() {
    this.router.use('/scripts', express.static(path.resolve(__dirname, 'dist', 'scripts')));

    const pages = await fs.readdir(this.pagesDirPath);

    for (let pageFName of pages) {
      const module = await import(`${this.pagesDirPath}/${pageFName}`);
      const [route] = pageFName.split('.tsx');
      const renderer = async () => {
        const props = module.props ? await module.props() : {};
        const App = module.default as () => JSX.Element;

        return [ReactDOMServer.renderToString(<App {...props} />), JSON.stringify(props)];
      };

      this.bindRoute(route, renderer);
    }
  }

  private async bindRoute(path: string, renderer: () => Promise<string[]>) {
    const routeCb: RequestHandler = (req, res) => {
      renderer()
        .then(([html, props]) => {
          res.write(baseTemplate(html, `/scripts/${path}.js`, props));
          res.end();
        })
        .catch((err) => {
          res.status(500);
          res.write(JSON.stringify(err));
          res.end();
        });
    };

    if (path === 'index') {
      this.router.get(`/`, routeCb);
    }

    const route = `/${path}(.html)?`;
    this.router.get(route, routeCb);
  }
}
