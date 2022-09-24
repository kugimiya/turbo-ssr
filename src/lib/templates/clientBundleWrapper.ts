export const clientBundleWrapper = (pagePath: string) => `
import ReactDOM from 'react-dom/client';
import React from 'react';
import Component from '${pagePath}';

ReactDOM.hydrateRoot(document.getElementById('root'), <Component {...window.__SERVER_PROPS}/>);
`;
