import fs from 'fs';
import fsPromises from 'fs/promises';
import { Request, Response } from 'express';
import path from 'path';
import * as TypeScript from "typescript";

export type ModuleType = {
  props?: (req: Request, res: Response) => Promise<Record<string, unknown>>;
  default: () => JSX.Element;
}
export type ModuleRendererCb = (req: Request, res: Response) => Promise<string[]>;
export type ModuleRendererFn = (path: string, mode: 'production' | 'development' | 'none', clientReactPath: string, clientReactDomPath: string, distPath: string) => Promise<ModuleRendererCb>;

const makeOsPath = (rawPath: string): string => {
  if (process.platform === 'win32') {
    return path.join(...(rawPath.split('/')));
  }
  
  return rawPath;
}

const TranspileTsReactToJs = async (inputPath: string, outName: string, distPath: string) => {
  const outputFilePath = path.resolve(distPath, 'scripts_ssr', outName);
  const fileContents = (await fsPromises.readFile(inputPath)).toString();

  const result = TypeScript.transpile(
    fileContents, 
    { 
      module: TypeScript.ModuleKind.UMD,
      jsx: TypeScript.JsxEmit.ReactJSX,
      target: TypeScript.ScriptTarget.ES2020,
      moduleResolution: TypeScript.ModuleResolutionKind.Node16,
    }
  );
  await fsPromises.writeFile(outputFilePath, result);
  return outputFilePath;
}

export const ModuleRenderer: ModuleRendererFn = async (filePath, mode, clientReactPath, clientReactDomPath, distPath) => {
  const React = require(clientReactPath);
  const { renderToString } = require(clientReactDomPath);
  
  const fileName = path.basename(filePath);
  const outputName = fileName.replace('tsx', 'js');
  let modulePath = await TranspileTsReactToJs(filePath, outputName, distPath);
  let module: ModuleType = await import(modulePath);

  if (mode !== 'production') {
    fs.watchFile(filePath, { interval: 500 }, async () => {
      console.log(`File at '${filePath}' changed. Rebuilding...`);

      // Node.JS кеширует импорты, поэтому нужно удалить кеш для изменной страницы
      delete require.cache[makeOsPath(modulePath)];
      modulePath = await TranspileTsReactToJs(filePath, outputName, distPath);
      module = await import(modulePath);
    });
  }

  return async (req, res) => {
    const props = module.props ? await module.props(req, res) : {};
    const App = module.default;

    try {
      return [renderToString(React.createElement(App, props)), JSON.stringify(props)];
    } catch (e) {
      console.log('Error at SSR stage:', e);
      return ['', '{}'];
    }
  };
};
