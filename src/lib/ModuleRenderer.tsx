import { renderToString } from 'react-dom/server';
import React from 'react';
import { Request, Response } from 'express';

export type ModuleType = {
  props?: (req: Request, res: Response) => Promise<Record<string, unknown>>;
  default: () => JSX.Element;
}

export type ModuleRendererCb = (req: Request, res: Response) => Promise<string[]>;

export const ModuleRenderer: (module: ModuleType) => ModuleRendererCb = (module) => async (req, res) => {
  const props = module.props ? await module.props(req, res) : {};
  const App = module.default;

  return [renderToString(<App {...props} />), JSON.stringify(props)];
};
