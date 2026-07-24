# Changelog

A plain-English record of what changed and why. Newest first.

## 2026-07-24 — Site-wide feed music + unmute button

Added a TikTok-style background song to the video feed.

- One looping song (`music/feed-music.mp3`) overlays the whole site — it's not tied
  to any individual clip.
- An unmute button sits next to the title pill on each video panel, so it appears
  once you scroll into the feed (not on the hero). Tapping it plays/pauses the song;
  that tap is the user gesture browsers require before audio can start. Videos
  themselves stay muted.
- The song is "Dub City," trimmed to start at 1:32 and re-encoded to 128 kbps MP3 for
  the web. To swap it, replace `music/feed-music.mp3` and redeploy.

Also added `add-music.sh` + `MUSIC.md`, tooling for an earlier approach (baking audio
into each video file) that we dropped in favor of the site-wide overlay. Kept for
reference in case per-video audio is wanted later.
