# E&B Studios Website

Static site for E&B Studios, published at **enbstudios.com** through GitHub Pages.

## Pages

- `index.html`: Home. The intro, a short consult pitch and selected work.
- `work.html`: A filterable portfolio.
- `consult.html`: Book a free 30-minute consult.

Shared files are `styles.css` (design tokens, layout and motion) and `script.js` (animations, filters and booking). Images live in `assets/img/`.

## Settings you'll edit

These are at the top of `script.js`, in `CONFIG`:

| Setting | What it does |
|---|---|
| `email` | The address shown in the footer and used for consult requests. |
| `bookingEmbedUrl` | Your Google Calendar booking link. If it's empty, the Consult page shows the built-in "request a slot" form, which opens the visitor's email app. |
| `timeZone`, `slots`, `closedWeekdays`, `leadDays` | Settings for the built-in request form only. |

### Connecting Google Calendar booking (free with a Gmail account)

1. In Google Calendar, go to **Create → Appointment schedule**. Set it to 30 minutes and choose your hours.
2. Save it, open the schedule, then click **Share → Website embed → Inline schedule**.
3. Copy the `src="…"` URL from the code Google shows you. It ends in `?gv=true`.
4. Paste that URL into `bookingEmbedUrl` in `script.js`. The Consult page switches to live availability automatically.

## Local preview

From this folder:

```bash
python3 -m http.server 4321
```

Then open http://127.0.0.1:4321/

## Publishing

GitHub Pages publishes the `main` branch. Redesign work happens on the `redesign` branch, so the live site doesn't change until `redesign` is merged into `main`.

**Do not delete `CNAME`.** It connects the custom domain to the site.

## Media

The site is photos only. Web copies were made from the originals in `Documents/AI Editor` using macOS's built-in `sips`: resized to a 1600–1800px long edge, then re-encoded so camera and GPS metadata is removed. Two of them (`il-halloween.jpg`, `il-install.jpg`) are frames pulled from reels.

Wedding work shows as N/A until there's footage to add.

### Adding reels later

`script.js` still contains the lightbox. Add `data-video="<url>"` and `data-title="…"` to a card in `work.html` and it becomes clickable, opening the video in an overlay. Host the files somewhere else (YouTube, Vimeo, or a CDN) rather than committing large videos to this repo.
