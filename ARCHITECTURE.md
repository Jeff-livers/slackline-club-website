# Architecture

How the site works, kept here (not in the shipped code) so the browser only ever
downloads clean HTML/CSS/JS. Read this before editing `app.js`.

## Files

| File          | Role                                                                 |
| ------------- | -------------------------------------------------------------------- |
| `index.html`  | Markup only: `<head>` metadata + analytics, hero section, script/style links. |
| `styles.css`  | All styling. One `:root` block of design tokens at the top.          |
| `app.js`      | All behaviour, wrapped in a single IIFE (nothing leaks to `window`). |
| `videos.json` | The ordered list of feed clips (`src` + `poster` per clip).          |

Static site, no build step. Files are served exactly as written, so anything you
put in them is public via view-source. Keep explanations in this doc instead.

## Page structure

The page is a vertical, TikTok-style scroll with CSS scroll-snap:

1. **Hero** (`.stage`) — hardcoded in `index.html`. A looping background video with
   a still-image fallback, the logo images, and the meeting-time pill.
2. **Feed** (`.video-panel` × N) — built by `app.js` at runtime from `videos.json`,
   one full-screen panel per clip, appended after the hero.

`html { scroll-snap-type: y mandatory }` plus `scroll-snap-align: start` on each
panel makes every swipe land on exactly one screen.

## Autoplay & the "unlock" gesture

Browsers only autoplay video that is **muted**, and some contexts (notably iOS Low
Power Mode) block autoplay entirely until the user interacts with the page. The feed
handles this in three parts:

- **Feed clips are always muted.** Sound never comes from the clips.
- **`IntersectionObserver`** (threshold 0.6) plays whichever panel is >60% on screen
  and pauses + rewinds the others. It also flips the next clip's `preload` to `auto`
  and calls `load()` so the following swipe starts instantly.
- **`tryPlay`** watches the `play()` promise. If it rejects (autoplay blocked), the
  panel gets `.is-paused`, which reveals the centered tap-to-play triangle.
- **`unlockAll`** runs on the first tap of any play button. It calls `play()` on
  every clip once (immediately pausing the ones off-screen), which satisfies the
  browser's "user gesture" requirement so the rest of the feed autoplays on scroll.

## Site-wide music

The song is a single looping `<audio id="feedmusic">` in `index.html`. It is **not**
tied to any clip — it plays over the whole site once started.

- Each feed panel gets its own unmute button (`makeSoundButton`), so the control
  only appears once you scroll into the feed, never on the hero.
- All buttons reflect one shared `musicOn` flag; `syncSoundButtons` keeps them in
  step so toggling on any panel updates them all.
- The tap on an unmute button is the user gesture that lets the audio element start
  (`toggleSound`). If `play()` is rejected, `musicOn` reverts.

To change the song, replace `music/feed-music.mp3` and redeploy. (See `MUSIC.md` for
the older, dropped approach of baking audio into each clip.)

## Text sizing in the pills

The title and meeting-time lines must fit the pill on one line at any width, so they
are sized in JS rather than with a fixed font-size.

`fitText` sets the element to a known 100px, measures `scrollWidth`, then scales the
font so the text exactly fills the available width. `fitTitle` and `fitInfo` compute
that available width from viewport minus the fixed chrome, using the constants at the
top of `app.js`:

- `PILL_H_PADDING` (30) — the pill's inner padding, both sides.
- `SOUND_BTN_SPACE` (56) — the 44px unmute button plus its 12px gap.
- `EDGE_MARGIN` (16) — breathing room at the viewport edges.
- `PILL_MAX_WIDTH` (450) — caps the title so it stops growing on wide screens.
- `INFO_MAX_FONT` (18) — caps the meeting line so it stays smaller than the title.

Both run on load (per panel) and on `resize`.

## Videos & hosting

Clip files are **not** in the repo (`.gitignore` excludes `Images/*.mp4` and
`r2-upload/`). They live on Cloudflare R2 and are served from
`videos.salidaslacklineclub.com`. Posters (`Images/posters/*.jpg`) are committed.
`videos.json` maps each clip's hosted `src` to its committed poster; the feed renders
in that array's order. See `ADDING_VIDEOS.md` for the upload workflow.
