# Pittsburgh LVT Dashboard

## Run locally

The dashboard is a static page and requires no build step. From this directory, run any local web server, for example:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173` in a browser. The page must be served over HTTP so the browser can fetch the data files.

## Data

The dashboard loads the frozen compressed dataset `public/master.csv.gz` and neighborhood boundaries from `public/neighborhoods.geojson`. Keep both files in the public assets when deploying. The compressed CSV is about 5 MB instead of about 48 MB uncompressed, making it suitable for GitHub Pages.

The interface summarizes property records by neighborhood, maps the selected metric, and exposes neighborhood-level details for exploration. Values are not official tax assessments.
