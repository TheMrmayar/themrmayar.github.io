# maharremayar.com: Astro site

Static academic website built with [Astro](https://astro.build), migrated from the Quarto site. Deployed to GitHub Pages at the custom domain `maharremayar.com`.

> **Build status:** this project was written in an environment that could not download npm packages, so `astro build` has **not** been run on it. The content-migration plugins, the CSS, and the verification script were tested with a local stand-in (see [What was tested](#what-was-tested)). Run the three commands in [Preview locally](#preview-locally) before deploying anything.

## Requirements

- Node.js 20.3+ or 22+ (check with `node -v`)
- npm (ships with Node)
- A GitHub account

## Preview locally

```sh
npm install        # installs Astro; also creates package-lock.json
npm run dev        # live preview at http://localhost:4321
```

Check the production build exactly as GitHub will run it:

```sh
npm run build      # writes the site to dist/
npm run verify     # checks text, URLs, local links, CNAME against migration/original
npm run preview    # serves dist/ at http://localhost:4321
```

## Where things are

| Path | What it is |
| --- | --- |
| `src/content/index.md` | Your `index.qmd`, byte-for-byte unchanged (front matter holds the twitter / papers / email links) |
| `src/content/cv.md` | Your `cv.qmd`, byte-for-byte unchanged |
| `src/assets/profile.jpg` | Your portrait. Astro resizes it and serves WebP |
| `src/config/site.mjs` | Site title and navigation, taken from `_quarto.yml` |
| `src/layouts/BaseLayout.astro` | Page shell: header, navigation, `<main>` |
| `src/pages/index.astro`, `cv.astro` | The two pages; each renders its Markdown file |
| `src/styles/global.css` | All styling (colors and fonts are variables at the top) |
| `plugins/` | Two small helpers that render the Pandoc-style Markdown faithfully (see below) |
| `public/CNAME` | `maharremayar.com`, copied into the site root on build |
| `.github/workflows/deploy.yml` | Builds and deploys to GitHub Pages on every push to `main` |
| `scripts/verify-site.mjs` | Post-build checks (`npm run verify`) |
| `migration/original/` | Your original `_quarto.yml`, `.qmd` files and photo, kept for reference and used by the verifier |

### Editing content later

Edit `src/content/index.md` and `src/content/cv.md` as you did the `.qmd` files. To add a CV entry, add a paragraph in the same shape as the existing ones (`2027 Winter Quarter **Title** *Role*, Place`); entries that begin with a year are laid out as date | details automatically. To change the navigation, edit `src/config/site.mjs`.

## Upload to GitHub

Your current site is published from the `docs` folder of an existing repository. To avoid touching the live site while you test, **use a new repository first**:

1. On github.com, create a new repository (for example `maharremayar-astro`). Leave it empty: no README, no license.
2. In this folder:

   ```sh
   git init -b main
   git add .
   git commit -m "Migrate site from Quarto to Astro"
   git remote add origin https://github.com/<your-username>/maharremayar-astro.git
   git push -u origin main
   ```

   Make sure `package-lock.json` (created by `npm install`) is included in the commit.

## Configure GitHub Pages

1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main` (or open the **Actions** tab and run **Deploy to GitHub Pages**). The first run takes a minute or two.
4. A test repository will publish at `https://<your-username>.github.io/maharremayar-astro/`. Because the site is configured for the root of a custom domain, **the stylesheet and images will not load at that address**; that is expected. A test repository is only for confirming that the Action builds. Preview the real look locally.

### Switching the live domain over

Do this only when you are happy with the local preview. Your domain can point at one place at a time.

1. If you are moving to a different repository, first remove the custom domain from the old repository (**Settings → Pages → Custom domain → Remove**).
2. In the new repository, open **Settings → Pages → Custom domain**, enter `maharremayar.com`, and save. `public/CNAME` already contains the domain.
3. Tick **Enforce HTTPS** once GitHub has verified the DNS (it can take a few minutes).

DNS records do not change if the domain already works with GitHub Pages. If you instead deploy from the **same** repository that currently holds `docs/`, set Pages → Source to **GitHub Actions**, remove the Quarto files (`_quarto.yml`, `*.qmd`, `docs/`) in the same commit, and push.

## URLs

- `/` is the home page. `/cv.html` is the CV, the same address Quarto produced, so existing links keep working. The navigation links to `/cv`, which GitHub Pages also serves.
- Headings keep the same anchors Quarto generated (for example `/cv.html#teaching-experience`).

## Notes on the migration

- **Content is unchanged.** `src/content/*.md` are identical to your `.qmd` files. `npm run verify` compares the visible text of each built page with them and fails on any difference.
- **Typographic substitution is off** (`smartypants: false`). Quarto's default turns straight apostrophes into curly ones (`I'm` → `I’m`). Your source has straight apostrophes, so they are kept.
- **Pandoc line breaks.** `cv.qmd` uses `\` on its own line and at the end of the "Publications in refereed journals" heading. Pandoc treats those as line breaks; Astro's parser would print the backslash. `plugins/remark-pandoc-breaks.mjs` gives them their Pandoc meaning, so no backslash appears.
- **Date layout.** `plugins/rehype-cv-entries.mjs` wraps the leading date of each CV entry in a `<span>` for styling. It adds, removes and changes no text.
- **Icons.** `index.qmd` names icons for the three links (twitter, newspaper, envelope). The new design shows the link text only.
- **Quarto's `search: false`** needs no equivalent: the new site has no search.
- **Fonts** are system fonts (Charter, falling back to Georgia or Cambria for the text; the system UI font for dates and navigation). Nothing is downloaded from third parties. To use a self-hosted web font, install it from npm (for example `@fontsource/...`) and change `--serif` / `--sans` at the top of `global.css`.

## What was tested

Tested in the authoring environment:

- Both plugins run against the real `cv.qmd`, using a local Markdown parser, and the output text matches the original.
- `scripts/verify-site.mjs` passes on a simulated build and fails when a word is altered.
- The real `global.css` renders correctly at 1440, 820 and 390 px widths in Chromium.

**Not tested here:** `npm install`, `astro build`, the Astro image pipeline, and the GitHub Actions workflow. Run the commands under [Preview locally](#preview-locally); `npm run verify` repeats the content checks against the real build output.
