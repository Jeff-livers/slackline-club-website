#!/usr/bin/env bash
# Bake a music track into already-compressed feed clip(s).
#
# The VIDEO is copied untouched (no re-compress, no quality loss, fast) and the
# song becomes the clip's audio, so it "insta-loads" and stays perfectly in sync
# on the website. Faststart is preserved so playback still starts instantly.
#
# Usage:
#   ./add-music.sh --all  <song>          # bake ONE song into every feed clip
#   ./add-music.sh <slug> <song>          # bake a song into ONE clip (per-video)
#   ...add --mix to keep the original recorded sound UNDER the music:
#   ./add-music.sh --all  <song> --mix
#
#   <song> = an .mp3 / .m4a / .wav music file (looped/trimmed to the clip length).
#
# Examples:
#   ./add-music.sh --all ~/Desktop/feed-song.mp3
#   ./add-music.sh taylor ~/Desktop/taylors-song.mp3
#
# After running: re-upload the changed r2-upload/*.mp4 to the R2 bucket and PURGE
# the cache for each (they're overwrites). See MUSIC.md for the full checklist.
set -euo pipefail
cd "$(dirname "$0")"

if [ $# -lt 2 ]; then
  echo "Usage:   ./add-music.sh --all  <song>          # every feed clip"
  echo "         ./add-music.sh <slug> <song>          # one clip"
  echo "         ...add --mix to keep the original sound under the music."
  exit 1
fi

target="$1"
song="$2"
mix=0
[ "${3:-}" = "--mix" ] && mix=1

if [ ! -f "$song" ]; then
  echo "! Music file not found: $song"
  exit 1
fi

# Bake $song into $in (in place, via a temp file). Video stream is copied.
bake() {
  local in="$1"
  if [ ! -f "$in" ]; then
    echo "  ! skip (not found): $in"
    return
  fi
  local tmp="${in%.mp4}.tmp.mp4"
  echo "==> $in"

  # Does this clip actually have original sound to mix with? Most feed clips are
  # silent, in which case --mix has nothing to blend and we just do a clean replace.
  local has_audio
  has_audio=$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$in" 2>/dev/null || true)

  if [ "$mix" = "1" ] && [ -n "$has_audio" ]; then
    # amix: original audio at full level, music a touch louder; no auto-normalize.
    ffmpeg -y -i "$in" -stream_loop -1 -i "$song" \
      -filter_complex "[0:a][1:a]amix=inputs=2:duration=first:weights=1 1.5:normalize=0[a]" \
      -map 0:v:0 -map "[a]" \
      -c:v copy -c:a aac -b:a 160k -shortest -movflags +faststart \
      "$tmp" </dev/null
  else
    if [ "$mix" = "1" ] && [ -z "$has_audio" ]; then
      echo "  (no original sound in this clip — using music only)"
    fi
    # Replace: music becomes the only audio track.
    ffmpeg -y -i "$in" -stream_loop -1 -i "$song" \
      -map 0:v:0 -map 1:a:0 \
      -c:v copy -c:a aac -b:a 160k -shortest -movflags +faststart \
      "$tmp" </dev/null
  fi
  mv "$tmp" "$in"
  echo "  ✓ done"
}

if [ "$target" = "--all" ]; then
  # Feed clips = whatever videos.json lists (this naturally excludes hero.mp4).
  slugs=$(grep -o 'salidaslacklineclub\.com/[^"]*\.mp4' videos.json | sed 's#.*/##; s#\.mp4##')
  if [ -z "$slugs" ]; then
    echo "! Couldn't read any clips from videos.json"
    exit 1
  fi
  for slug in $slugs; do
    bake "r2-upload/${slug}.mp4"
  done
else
  bake "r2-upload/${target}.mp4"
fi

echo ""
echo "Next steps:"
echo "  1. Re-upload the changed r2-upload/*.mp4 to the 'slackline-videos' R2 bucket"
echo "     (overwrite the existing files at the bucket root)."
echo "  2. PURGE the Cloudflare cache for each changed file URL (required on overwrite):"
echo "     Cloudflare -> salidaslacklineclub.com -> Caching -> Configuration -> Purge Cache"
echo "     e.g. https://videos.salidaslacklineclub.com/taylor.mp4"
echo "  3. The unmute button is already live on the site (no code change needed)."
