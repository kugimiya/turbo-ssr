import fs from 'fs';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { Request, Response } from 'express';
import path from 'path';

export type ModuleType = {
  props?: (req: Request, res: Response) => Promise<Record<string, unknown>>;
  default: () => JSX.Element;
}
export type ModuleRendererCb = (req: Request, res: Response) => Promise<string[]>;
export type ModuleRendererFn = (path: string, mode: 'production' | 'development' | 'none') => Promise<ModuleRendererCb>;

const makeOsPath = (rawPath: string): string => {
  if (process.platform === 'win32') {
    return path.join(...(rawPath.split('/')));
  }
  
  return rawPath;
}

export const ModuleRenderer: ModuleRendererFn = async (path, mode) => {
  let module: ModuleType = await import(path);

  if (mode !== 'production') {
    fs.watchFile(path, { interval: 500 }, async () => {
      console.log(`File at '${path}' changed. Rebuilding...`);

      // Node.JS кеширует импорты, поэтому нужно удалить кеш для изменной страницы
      delete require.cache[makeOsPath(path)];
      module = await import(path);
    });
  }

  return async (req, res) => {
    const props = module.props ? await module.props(req, res) : {};
    const App = module.default;

    return [renderToString(<App {...props} />), JSON.stringify(props)];
  };
};
