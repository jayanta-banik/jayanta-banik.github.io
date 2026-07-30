# jayanta-banik.github.io

Personal academic homepage. Static site, no build step, deployed via GitHub
Pages at [jayantabanik.com](https://jayantabanik.com).

## Structure

`index.html` is a thin shell. Each page section lives in its own component and
is pulled in at runtime by `js/include.js` (any element with a `data-include`
attribute is replaced by that file's contents).

```
index.html              Shell: <head> + component placeholders
components/
  intro.html            Introduction / bio + links
  publications.html     Publications
  projects.html         Selected Projects
  experience.html       Professional Experience
  footer.html           Footer
css/style.css           Styles
js/include.js           Loads the components, then the scripts below
js/viz.js               Interactive canvas visuals for the thumbnails
js/carousel.js          Image carousels for publication thumbnails
images/                 Optimized JPEG thumbnails + profile photo
assets/                 CV (PDF)
```

## Local preview

Components are loaded with `fetch`, which is blocked over `file://`, so use a
local server:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Editing

- **A section's content** — edit the matching file in `components/`.
- **Add a section** — create `components/<name>.html`, then add
  `<div data-include="components/<name>.html"></div>` to `index.html`.
- **Colors / spacing** — the tokens at the top of `css/style.css`.
- **Project visuals** — each is a small function in `js/viz.js`, registered by
  canvas id in `boot()`.
