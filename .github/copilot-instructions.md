# Copilot / AI Agent Instructions for this repo

This repository is a small static website built with a minimal Webpack pipeline. Below are concise, actionable notes an AI agent should follow to work productively here.

1. Big picture
- **Static site**: multiple standalone HTML pages (e.g. `index.html`, `chi-siamo.html`, `servizi.html`) live in the project root and are served/copy-deployed as-is.
- **Build pipeline**: Webpack bundles site JS and copies static assets to `dist` for production (`webpack.config.prod.js`). The dev server (`webpack.config.dev.js`) serves the project root for fast iteration.

2. Key files and conventions (start here)
- **`package.json`**: developer commands:
  - `npm start` → runs `webpack serve --config webpack.config.dev.js` (dev server with HMR/liveReload).
  - `npm run build` → runs `webpack --config webpack.config.prod.js` to generate `dist/`.
  - `test` is a placeholder (no tests configured).
- **`webpack.common.js`**: single entry `app: './js/app.js'`. Bundle output is `dist/js/app.js` (filename set to `./js/app.js`). `output.clean` is enabled (dist cleaned each build).
- **`webpack.config.dev.js`**: dev server serves `static: ['./']` (project root). Hot reload + inline source maps enabled.
- **`webpack.config.prod.js`**: production merges common config and uses `HtmlWebpackPlugin` with `template: './index.html'` and `CopyPlugin` to copy `img`, `css`, `js/vendor` and other static files into `dist`.

3. Practical developer workflows
- Local development: run
  ```powershell
  npm install; npm start
  ```
  The site will open in the browser and watch files in the project root.
- Production build: run
  ```powershell
  npm run build
  ```
  Result: `dist/` contains bundled JS (`js/app.js`) plus copied static assets (`css/`, `img/`, `js/vendor`, `favicon.ico`, etc.).
- Debugging: source maps are enabled in dev (`devtool: 'inline-source-map'`). Edit `js/app.js` for JS changes and `css/style.css` for styling.

4. Project-specific patterns and gotchas
- **Multiple HTML pages are static**: The repo keeps multiple full HTML files in the root (e.g. `contatti.html`, `prezzi.html`). `HtmlWebpackPlugin` uses `index.html` as a template for production; the other pages are not processed by the plugin and are copied as-is (see `CopyPlugin` patterns like `{ from: '404.html', to: '404.html' }`). Do not assume a single-page app.
- **CSS is not processed by Webpack**: `css/style.css` is copied directly (via `CopyPlugin`), not imported into JS. If you want CSS bundling, you must add CSS loaders and update `webpack.common.js` and `webpack.config.prod.js` accordingly. Until then, update `css/style.css` directly.
- **Vendor JS**: third-party libs are kept in `js/vendor/` and copied to `dist/js/vendor`. If you want a dependency bundled instead, import it from `js/app.js` or add a separate entry in `webpack.common.js`.
- **Output filename and template script tag**: `webpack.common.js` sets bundle filename to `./js/app.js`. The `index.html` template already includes `<script src="js/app.js"></script>`; `HtmlWebpackPlugin` will also inject the bundle by default, which may lead to duplicate scripts in the generated `dist/index.html`. When modifying templates, check for duplicate script tags or set plugin options to avoid double injection.
- **Adding static assets**: to ensure new asset folders are included in production, add a `CopyPlugin` pattern in `webpack.config.prod.js`. Example: to add `fonts/`, add `{ from: 'fonts', to: 'fonts' }` to `patterns`.

5. How to modify JS/CSS/HTML safely
- Change behavior/logic: edit `js/app.js` (single entry point). Keep vendor libraries in `js/vendor` unless you intentionally want to include them in the bundle.
- Add new JS to bundle: import it from `js/app.js` or add an entry in `webpack.common.js`.
- Add new CSS that should be served statically: place in `css/` and ensure `CopyPlugin` copies it (by default the entire `css` folder is copied).
- Add new page templates: keep using plain HTML files in project root. If you need them processed by Webpack, add an `HtmlWebpackPlugin` instance per page in `webpack.config.prod.js`.

6. Integration points and external dependencies
- Build tooling: `webpack`, `webpack-cli`, `webpack-dev-server`, `webpack-merge`, `html-webpack-plugin`, `copy-webpack-plugin` (see `package.json` devDependencies).
- External resources: fonts and some images are loaded remotely (e.g. Google Fonts, Unsplash in `index.html`).

7. Examples (quick edits)
- To add a new JS module `js/utils.js` that the site uses, add `import './utils.js'` at the top of `js/app.js`.
- To copy a new folder `fonts/` to production, edit `webpack.config.prod.js` CopyPlugin patterns:
  ```js
  { from: 'fonts', to: 'fonts' }
  ```
- To run the dev server after dependencies are installed:
  ```powershell
  npm install; npm start
  ```

8. Files to inspect when troubleshooting
- `package.json` (scripts and devDependencies)
- `webpack.common.js`, `webpack.config.dev.js`, `webpack.config.prod.js` (build pipeline)
- `js/app.js` (site JS entry)
- `css/style.css` (site styles)
- `index.html` and other HTML files in project root

If any of the above assumptions are incorrect or you want the project to switch to a different asset-processing strategy (e.g. CSS/asset bundling or multi-page HtmlWebpackPlugin), tell me which direction you prefer and I will update the build config and this guidance accordingly.

---
Please review these points and tell me if you want the file reworded, shortened, or expanded with command examples or change instructions (e.g. how to add CSS loaders or add a second HtmlWebpackPlugin entry).
