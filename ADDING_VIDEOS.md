# How to add (or replace) videos

The feed videos are **not** stored in this repo. They live in a Cloudflare **R2** bucket
(`slackline-videos`) and are served from `https://videos.salidaslacklineclub.com/<name>.mp4`.
The website just lists them in [videos.json](videos.json).

So adding a clip is 4 things: **compress it → upload it to R2 → list it in `videos.json` → push.**

> ⚠️ **Always run clips through `./add-video.sh` — never hand-make or hand-convert an MP4.**
> The script automatically adds "fast start," which moves the video's tiny index (the
> `moov` atom) to the front of the file. That's what lets a browser start playing
> immediately instead of downloading the whole file first. A video made any other way
> can land with that index at the *end*, and it'll just spin at 0:00 forever (this is
> exactly what happened to `taylor.mp4`). If you ever hit a stuck video, that's the cause —
> re-run it through the script and re-upload.

---

## One-time setup (only if it's a new computer)

You need `ffmpeg` (does the compression). Check / install:

```bash
ffmpeg -version        # if this errors:
brew install ffmpeg
```

---

## Never used Terminal / a `.sh` script? Start here

A `.sh` file (`add-video.sh`) is just a **text file full of terminal commands**, run top
to bottom. Instead of typing several `ffmpeg` commands by hand every time, you run the one
file and it does them for you. You can open it and read it — nothing is hidden or compiled.

**To run it:**

1. **Open Terminal.** Press `Cmd+Space`, type `Terminal`, hit Enter. (It's built into every Mac.)

2. **Go to the project folder** (this tells Terminal where you are). Paste this line and hit Enter:
   ```bash
   cd "/Users/jefflivers/Documents/Personal Projects/Slackline Club/slackline-club-website"
   ```
   `cd` = "change directory." The quotes matter because the folder names have spaces.

3. **Run the script**, giving it your video and a slug:
   ```bash
   ./add-video.sh ~/Desktop/my-clip.mov taylor
   ```
   - `./` = "the script is right here in this folder" (without it you'll get *command not found*).
   - `~/Desktop/my-clip.mov` = your input video. `~` means your home folder, so this is your Desktop.
   - `taylor` = the slug (short lowercase name it saves the file as).

**If you ever see `permission denied`:** the file just needs to be marked as runnable. Do this
once and it sticks:
```bash
chmod +x add-video.sh
```
`chmod +x` = "allow this file to run." You only ever need it once per script.

That's the whole thing — open Terminal, `cd` into the folder, run `./add-video.sh`. Nothing
gets installed and nothing is hidden.

---

## Add a NEW clip

### 1. Compress it + make a poster (one command)

From the project folder, run the helper script with your video and a **slug**
(a short lowercase name, no spaces — it becomes the fyilename and the URL):

```bash
./add-video.sh ~/Desktop/your-new-clip.mov sarah-highline
```

This creates two files:
- `r2-upload/sarah-highline.mp4`  ← the small, web-ready video to upload
- `Images/posters/sarah-highline.jpg`  ← the thumbnail (stays in the repo)

A raw 100+ MB phone clip becomes a few MB. The script also adds "fast start" so it begins
playing instantly instead of buffering.

### 2. Upload the video to R2

1. Go to **dash.cloudflare.com → R2 → `slackline-videos`**.
2. Click **Upload**.
3. Open the `r2-upload` folder on your computer and drag **the `.mp4` file itself** in —
   ⚠️ **not the folder**. (Dragging the folder puts files in a subpath and they won't load.)
   The file must sit at the **top level** of the bucket.

That's it — no cache purge needed for brand-new files.

### 3. List it in `videos.json`

Open [videos.json](videos.json) and add a line for the new clip. Each clip is one `{ ... }`
block; keep commas between blocks but **no comma after the last one**. Example:

```json
[
  { "src": "https://videos.salidaslacklineclub.com/jeff-main.mp4", "poster": "Images/posters/jeff-main.jpg" },
  { "src": "https://videos.salidaslacklineclub.com/sarah-highline.mp4", "poster": "Images/posters/sarah-highline.jpg" }
]
```

The order in this file = the order they appear in the feed.

### 4. Push to publish

```bash
git add -A
git commit -m "add sarah-highline clip"
git push
```

Cloudflare Pages auto-deploys `main` in ~1–2 minutes. Hard-refresh the site
(`Cmd+Shift+R`) to see it.

---

## REPLACE an existing clip (e.g. better quality)

1. Re-run the script with the **same slug** to regenerate the files:
   `./add-video.sh ~/Desktop/better-version.mov jeff-main`
2. Upload the new `r2-upload/jeff-main.mp4`, overwriting the old one in the bucket.
3. **Purge the cache** (this step is only needed when overwriting, because the old version
   is cached): Cloudflare → **salidaslacklineclub.com → Caching → Configuration →
   Purge Cache → Custom Purge** → paste the file URL
   `https://videos.salidaslacklineclub.com/jeff-main.mp4` → Purge.
4. If the poster changed, `git add -A && git commit && git push` as well.
5. To see it on your own screen, hard-refresh or use a private window (your *browser*
   also caches the old file for a few hours).

---

## REMOVE a clip

1. Delete its `{ ... }` line from [videos.json](videos.json).
2. (Optional) Delete the file from the R2 bucket and its `Images/posters/<slug>.jpg`.
3. `git add -A && git commit -m "remove <slug>" && git push`.

---

## Good to know

- **Keep your raw originals somewhere safe** (external drive / cloud). The repo only ever
  has the compressed versions on R2. Your current originals are in
  `../raw-video-originals/`.
- **Why this setup is cheap:** R2 has no per-view/bandwidth charges, so traffic (even bots)
  won't run up a bill. Storage is pennies at this scale.
- **Slug rules:** lowercase, dashes instead of spaces, ends in nothing special
  (`blake-canon`, not `Blake (canon)`). Spaces/parentheses break URLs.
- **The `r2-upload/` folder is git-ignored** — it's just a staging area on your computer,
  it never gets committed. That's fine.
- **Hero video** (the looping background on the landing screen) is special: it's
  `hero.mp4` in the bucket and is kept at full quality. To change it, replace `hero.mp4`
  the same way as "Replace an existing clip" above.
