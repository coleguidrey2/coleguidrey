# Pittsburgh LVT Dashboard

## Run locally

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite.

## Build for a personal website

```bash
npm run build
```

Upload the contents of the generated `dist/` folder to your web host.

The dashboard loads the frozen compressed dataset `public/master.csv.gz` automatically. Keep that file in the public assets when deploying. The compressed file is about 5 MB instead of about 48 MB uncompressed, making it suitable for GitHub Pages.

## Notes

The app is based on `LVTDashboard-3.jsx` and includes the supplied `master-2.csv` data renamed to `master.csv` for the app's automatic loader.
