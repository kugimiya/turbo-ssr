import * as ReactDOMServer from 'react-dom/server';
import fs from 'fs/promises';
import express, { Express, RequestHandler } from 'express';
import { baseTemplate } from './const';
import { Webpack } from './Webpack';

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
    const pages = await fs.readdir(this.pagesDirPath);

    for (let pageFName of pages) {
      const module = await import(`${this.pagesDirPath}/${pageFName}`);
      const [route] = pageFName.split('.tsx');
      const renderer = async () => {
        const element = module.default(module.props ? await module.props() : {});
        const rendered = ReactDOMServer.renderToString(element);

        return baseTemplate(rendered);
      };

      this.bindRoute(route, renderer);
    }
  }

  private async bindRoute(path: string, renderer: () => Promise<string>) {
    const routeCb: RequestHandler = (req, res) => {
      renderer().then(s => res.send(s));
    };

    if (path === 'index') {
      this.router.get(`/`, routeCb);
    }

    const route = `/${path}(.html)?`;
    this.router.get(route, routeCb);
  }
}
