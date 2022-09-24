import fs from 'fs/promises';
import { ModuleBundler } from "./ModuleBundler";

export const Bundler = async (pagesDirPath: string) => {
  const pages = await fs.readdir(pagesDirPath);

  for (let pageFName of pages) {
    const [route] = pageFName.split('.tsx');

    const builder = new ModuleBundler(route, `${pagesDirPath}/${pageFName}`, 'development');
    await builder.run();
  }
}
