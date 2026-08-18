---
title: How to add a post or note
---

## Writing (blog)

Create a file in `src/content/posts/`. Use a date in the filename or in front matter:

```
---
title: A thing I want to remember
date: 2026-08-18
---

Body in Markdown.
```

It shows up under `/writing/` after the local server reloads.

## Notes (store)

Create a file in `src/content/notes/`:

```
---
title: Some standing note
---

This one is evergreen. It is listed by title, not by date.
```

## Skip publishing a draft

Add `draft: true` in the front matter. Drafts stay off the collections until you remove that flag.

## Images, video, YouTube

Put files in `src/media/`, then use shortcodes in a post or note:

```
{% image "/media/setup.jpg", "Bench setup", "Optional caption" %}

{% video "/media/demo.mp4", "A short demo" %}

{% youtube "dQw4w9WgXcQ", "Talk title" %}
```

On the landing page, frames are HTML canvases in `src/index.njk`. Replace the SVG placeholders with real photos and keep the same CSS classes so crop (`object-fit` / `object-position`) stays under your control.
