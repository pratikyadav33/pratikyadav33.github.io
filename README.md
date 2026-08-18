# pratikyadav33.github.io

Personal site for **Pratik Yadav** — profile, writing, and notes. Built with [Eleventy](https://www.11ty.dev/).

**Live site:** https://pratikyadav33.github.io/

## Run locally (WSL)

```bash
git clone https://github.com/pratikyadav33/pratikyadav33.github.io.git
cd pratikyadav33.github.io
npm install
npm run dev
```

Open [http://localhost:4000](http://localhost:4000) in your browser.

| URL | What |
| --- | --- |
| `/` | Profile |
| `/writing/` | Blog |
| `/notes/` | Notes |

## Add content

- Blog post: `src/content/posts/your-title.md`
- Note: `src/content/notes/your-title.md`
- Bio: `src/index.njk`
- Site name: `src/_data/site.json`
- Images: `src/media/`

## Publish

Pushes to `main` deploy automatically via GitHub Actions (`.github/workflows/pages.yml`).
