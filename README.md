# ZOEL client preview

A static design preview for client review, using six AI-assisted studio edits for the collection, with black backgrounds, refined lighting and matching 1:1 framing. The hero and editorial photographs retain their original treatment. The hero lens, photo galleries and icon motion are retained. Contact links stay within the preview, and the enquiry form only displays a local confirmation; nothing is sent or stored.

## Deploy

1. Push this repository to the `main` branch of `AEIOI-98/zoel-client-preview`.
2. In the repository, open **Settings → Pages → Build and deployment** and select **GitHub Actions** as the source.
3. Open **Actions → Deploy client preview to GitHub Pages → Run workflow**, select `main`, and run it. Subsequent pushes to `main` deploy automatically.
4. After deployment succeeds, open **https://aeioi-98.github.io/zoel-client-preview/** and share that link with the client.

No build command, package installation or custom domain is needed. The workflow publishes only `dist/`; all runtime assets use relative paths.

## Preview visibility

The Pages URL is public and can be opened by anyone with the link. The HTML contains `noindex, nofollow`, requesting exclusion from search engines; this is **not authentication or access control**. Crawling is allowed in `robots.txt` so search engines can read that instruction. Do not put confidential material in this repository or site.

## Local preview

From this directory run `python3 -m http.server 4175 --bind 127.0.0.1 --directory dist`, then visit `http://127.0.0.1:4175/`. Stop it with Ctrl+C when finished.

GSAP and font license notices are retained in `dist/vendor/` and `dist/assets/fonts/`.

## Studio collection photography

All six collection views and their thumbnails use optimized WebP copies of the approved studio-preview images. Main images are 1254 × 1254 pixels; gallery plates are 1:1 on desktop and mobile. The corrected ruby specimen is retained. `STUDIO-PHOTOGRAPHY.json` records source provenance and published paths. The enlarged viewer reads the same gallery sources.
