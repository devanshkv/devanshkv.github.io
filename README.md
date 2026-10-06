# Devansh Agarwal — personal website

An Astro personal website with static pages and plain CSS, published at https://devanshkv.github.io/.

## Local preview

Requires Node.js 22.12+ (an even-numbered release) and npm.

```sh
npm ci
npm test
npm run preview
```

Open http://127.0.0.1:4321. The preview serves only the generated `dist/` directory. Rebuild with `npm test` after edits, then reload the preview. `npm run dev` is also available while developing.

The new source lives in `src/`; builds are written to `dist/`. Teaching resources retain their original URL. `/projects/` forwards to `/work/`. The supplied portrait is used on Home and About. The old project list, blog, and resume are excluded from the new site, and contact links point to LinkedIn.

The embedded bibliography uses OpenAlex records matched to ORCID `0000-0003-0385-491X`, with a link to Google Scholar. It shows journal and conference publications, removes duplicate titles, and omits preprints, datasets, repository releases, and source-code registry records. The static snapshot in `src/data/publications.json` keeps papers visible without JavaScript or when the API is unavailable; the browser attempts a live refresh. Run `npm run sync-papers` before building to refresh the saved snapshot. No API key is required.

The theme follows the device setting until the visitor chooses Dark mode in the header. The choice is saved in the browser; the system theme also works without JavaScript.

Google Analytics 4 uses Measurement ID `G-HRBQHD2D03` in the shared layout. The Google tag loads only on `devanshkv.github.io`, so local previews do not send visits. Google Signals and advertising personalization are disabled. Enable Enhanced measurement in the Web stream to report scrolls and outbound clicks, including paper and profile links. Check Analytics → Reports → Realtime after a production visit to verify collection.

## Publishing

Push changes to `master` to publish the site. `.github/workflows/deploy.yml` installs dependencies, runs `npm test`, and deploys only `dist/` to GitHub Pages. The repository's Pages source must be set to GitHub Actions. The workflow can also be run manually from the Actions tab.
