export const clientBundleWrapper = (pagePath: string) => `
import ReactDOM from 'react-dom/client';
import React from 'react';
import Component from '${pagePath}';

type ArgumentsTuple = Parameters<typeof Component>;
type Props = ArgumentsTuple['length'] extends 0 
  ? Record<string, unknown>
  // @ts-ignore потому-что в данном случае точно есть 0 элемент в типеп тупла
  : ArgumentsTuple[0];

let root = document.getElementById('root');
if (root) {
  ReactDOM.hydrateRoot(
    root,
    <Component {...(window as unknown as Window & { __SERVER_PROPS: Props }).__SERVER_PROPS} />
  );
}
`;
