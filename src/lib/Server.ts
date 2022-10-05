import fs from 'fs/promises';
import path from 'path';
import express, { Express, RequestHandler } from 'express';
import { ModuleRenderer, ModuleRendererCb } from './ModuleRenderer';
import { baseHtml } from './templates/baseHtml';

export class Server {
  private router: Express;

  constructor(
    private pagesDirPath: string,
    private distPath: string,
    private listenPort: number,
    private mode: 'production' | 'development' | 'none',
    private clientReactPath: string,
    private clientReactDomServerPath: string,
  ) {
    this.router = express();
  }

  public listen(cb: () => void) {
    this.router.listen(this.listenPort, cb);
  }

  public async bindRoutes() {
    this.router.use('/scripts', express.static(path.resolve(this.distPath, 'scripts')));

    const pages = await fs.readdir(this.pagesDirPath);

    for (let pageFName of pages) {
      const [route] = pageFName.split('.tsx');
      const renderer = await ModuleRenderer(`${this.pagesDirPath}/${pageFName}`, this.mode, this.clientReactPath, this.clientReactDomServerPath, this.distPath);

      this.bindRoute(route, renderer);
    }
  }

  private async bindRoute(path: string, renderer: ModuleRendererCb) {
    const routeCb: RequestHandler = (req, res) => {
      renderer(req, res)
        .then(([html, props]) => {
          res.write(baseHtml(html, `/scripts/${path}.js`, props));
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
