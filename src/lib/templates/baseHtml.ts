export const baseHtml = (content: string, scriptBundlePath: string, propsJson: string) => `
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
    <script src="/scripts/shared.js"></script>
    <script src="${scriptBundlePath}"></script>
  </body>
</html>
`;
