#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
mkdir -p r2-upload Images/posters

# "source path|slug" — slug used for both the mp4 and the poster jpg
clips=(
  "Images/Jeff on the line main clip.mp4|jeff-main"
  "Images/Blake (canon) on the line.mp4|blake-canon"
  "Images/Alex on the line.mp4|alex"
  "Images/Jeff walking on the line.mp4|jeff-walking"
  "Images/Toni on the line.mp4|toni"
  "Images/Blake walking in style.mp4|blake-style"
  "Images/IMG_3368.mp4|hero"
)

for entry in "${clips[@]}"; do
  src="${entry%%|*}"
  slug="${entry##*|}"
  out="r2-upload/${slug}.mp4"
  poster="Images/posters/${slug}.jpg"

  echo "=== Compressing: $src -> $out ==="
  ffmpeg -y -i "$src" \
    -vf "scale='min(1080,iw)':-2" \
    -c:v libx264 -profile:v high -crf 24 -preset slow \
    -movflags +faststart -an \
    "$out" </dev/null

  echo "=== Poster: $out -> $poster ==="
  ffmpeg -y -ss 00:00:01 -i "$out" -vframes 1 \
    -vf "scale='min(720,iw)':-2" -q:v 4 \
    "$poster" </dev/null
done

echo ""
echo "=== Done. Compressed sizes: ==="
du -h r2-upload/*.mp4 | sort -h
echo ""
echo "=== Poster sizes: ==="
du -h Images/posters/*.jpg | sort -h
