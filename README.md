# Personal site (local first)

Profile, writing, and notes. Built with [Eleventy](https://www.11ty.dev/). GitHub Pages comes after the local preview looks right.

## Run locally (WSL)

```bash
cd ~/.github.io
npm install
npm run dev
```

Open [http://localhost:4000](http://localhost:4000) in your browser.

| URL | What |
| --- | --- |
| `/` | Profile |
| `/writing/` | Blog |
| `/notes/` | Notes store |

## Add content

- Blog post: `src/content/posts/your-title.md`
- Note: `src/content/notes/your-title.md`
- Bio: `src/index.njk`
- Site name: `src/_data/site.json`
- Landing images: `src/media/`

## Later (not done yet)

Rename the GitHub repo to `pratikyadav33.github.io`, make it public, then publish with GitHub Pages.
