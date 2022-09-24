export const baseTemplate = (content: string, scriptBundlePath: string, propsJson: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <script>
      window.__SERVER_PROPS = JSON.parse('${propsJson}');
    </script>
  </head>
  <body>
    <div id="root">${content}</div>
    <script src="${scriptBundlePath}"></script>
  </body>
</html>
`;

export const clientWrapper = (pagePath: string) => `
import ReactDOM from 'react-dom/client';
import React from 'react';
import Component from '${pagePath}';

ReactDOM.hydrateRoot(document.getElementById('root'), <Component {...window.__SERVER_PROPS}/>);
`;
