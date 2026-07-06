#!/usr/bin/env bash
# Compress one new clip for the feed + make its poster.
# Usage:  ./add-video.sh <input-video> <slug>
# Example: ./add-video.sh ~/Desktop/sarah-clip.mov sarah-highline
set -euo pipefail
cd "$(dirname "$0")"

if [ $# -lt 2 ]; then
  echo "Usage:   ./add-video.sh <input-video> <slug>"
  echo "Example: ./add-video.sh ~/Desktop/sarah-clip.mov sarah-highline"
  echo "  <slug> = short lowercase name, no spaces (becomes the filename + URL)"
  exit 1
fi

input="$1"
slug="$2"
mkdir -p r2-upload Images/posters
out="r2-upload/${slug}.mp4"
poster="Images/posters/${slug}.jpg"

echo "==> Compressing  $input  ->  $out"
ffmpeg -y -i "$input" \
  -vf "scale='min(1080,iw)':-2" \
  -c:v libx264 -profile:v high -crf 24 -preset slow \
  -movflags +faststart -c:a aac -b:a 128k \
  "$out" </dev/null

echo "==> Poster       $out  ->  $poster"
ffmpeg -y -ss 00:00:01 -i "$out" -frames:v 1 \
  -vf "scale='min(720,iw)':-2" -q:v 3 \
  "$poster" </dev/null

echo ""
echo "==> Done:"
du -h "$out" "$poster"
echo ""
echo "Next steps:"
echo "  1. Upload  $out  to the 'slackline-videos' R2 bucket"
echo "     (open the r2-upload folder and drag the FILE into the bucket root)."
echo "  2. Add this line to videos.json:"
echo "       { \"src\": \"https://videos.salidaslacklineclub.com/${slug}.mp4\", \"poster\": \"Images/posters/${slug}.jpg\" }"
echo "  3. git add -A && git commit -m \"add ${slug} clip\" && git push"
