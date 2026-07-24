# Music & sound on the feed

The feed works like TikTok: clips autoplay **muted** (browsers require that), and a
little **speaker button** (top-right) lets a visitor turn sound on. Once they tap it,
sound stays on as they scroll through the rest of the clips.

The music is **baked into each video file** — it's part of the clip's audio, so it
loads instantly with the video and never drifts out of sync. Turning it on is just
un-muting; there's no second file to download and nothing to wait for.

> The speaker button is already live on the site — it needed no per-clip setup and
> works with whatever audio is in each clip. This doc is only about **putting music
> into the clips.**

---

## Before you start: get a music file

You need one audio file (`.mp3`, `.m4a`, or `.wav`). The script loops it if it's
shorter than a clip and trims it if it's longer, so length doesn't matter.

> ⚠️ **Use music you're allowed to use.** This is a public website, so grab something
> royalty-free / license-free (e.g. YouTube Audio Library, Pixabay Music, Uppbeat) or
> your own recording. TikTok's licensed songs are fine *inside the TikTok app* but not
> for reuse on your own site.

You also need `ffmpeg` (same tool the video script uses):
```bash
ffmpeg -version        # if this errors:  brew install ffmpeg
```

---

## Start here: one song for the whole feed

This bakes the **same song** into every clip, from the top of each. One command:

```bash
cd "/Users/jefflivers/Documents/Personal Projects/Slackline Club/slackline-club-website"
./add-music.sh --all ~/Desktop/feed-song.mp3
```

`--all` = every clip currently listed in [videos.json](videos.json). The `hero.mp4`
background is left alone. Your clips live in `r2-upload/` and get updated **in place**
(the video is copied untouched — no quality loss, and it's fast).

Then publish the updated clips:

1. **Re-upload** the changed `r2-upload/*.mp4` files to the **`slackline-videos`** R2
   bucket (dash.cloudflare.com → R2), overwriting the old ones at the bucket root.
2. **Purge the cache** for each file you overwrote — required whenever you replace an
   existing file. Cloudflare → **salidaslacklineclub.com → Caching → Configuration →
   Purge Cache → Custom Purge** → paste each URL, e.g.
   `https://videos.salidaslacklineclub.com/taylor.mp4`.
3. Hard-refresh the site (`Cmd+Shift+R`) or use a private window to hear it (your
   browser also caches the old file for a while).

That's it — nothing to commit to git for the music itself (the clips live on R2, and
`r2-upload/` is git-ignored).

---

## Later: switch to a different song per clip

Same tool, but give it a **slug** instead of `--all`, and run it once per clip with
that clip's song. The slug is the filename without `.mp4` (see [videos.json](videos.json)).

```bash
./add-music.sh taylor      ~/Desktop/taylors-song.mp3
./add-music.sh jeff-main   ~/Desktop/jeffs-song.mp3
./add-music.sh blake-canon ~/Desktop/blakes-song.mp3
# ...and so on for the clips you want to change
```

Then re-upload + purge cache for **just the clips you changed** (steps 1–3 above).
You can do this gradually — clips you haven't touched keep whatever song they had.

**Current feed slugs:** `taylor`, `jeff-main`, `blake-canon`, `alex`, `jeff-walking`,
`toni`, `blake-style`. (The live list is always [videos.json](videos.json).)

### Redo / undo a clip's music

- **Replace mode (the default) is safe to re-run.** Running `add-music.sh` on a clip
  again just swaps in the new song — old baked music is discarded, not stacked.
- **To get a clip back to silence / original**, regenerate it from your raw original
  with `./add-video.sh` (see [ADDING_VIDEOS.md](ADDING_VIDEOS.md)), then re-upload.

---

## Optional: keep the original sound *under* the music

By default the music **replaces** the clip's recorded audio (wind, chatter). To instead
**mix** the music on top of the original sound, add `--mix`:

```bash
./add-music.sh --all ~/Desktop/feed-song.mp3 --mix
./add-music.sh taylor ~/Desktop/taylors-song.mp3 --mix
```

> Note: `--mix` layers audio, so don't run it twice on the same clip (that would stack
> two copies of the music). If you want to redo a mixed clip, regenerate it with
> `add-video.sh` first, then mix once.

---

## How to add a brand-new clip *with* music

1. Make the clip as usual: `./add-video.sh ~/Desktop/new-clip.mov new-slug`
   (see [ADDING_VIDEOS.md](ADDING_VIDEOS.md)), and add it to `videos.json`.
2. Bake in its song: `./add-music.sh new-slug ~/Desktop/its-song.mp3`
3. Upload `r2-upload/new-slug.mp4` (brand-new file → no cache purge needed).
