#!/bin/bash
# Usage: ./scripts/add-course.sh <course-name> <dpn-learning-center-path>
# Example: ./scripts/add-course.sh intro-to-monitors ~/Workspaces/dpn-learning-center

COURSE=$1
SRC=$2/courses/$COURSE/assets
DST=public/assets/$COURSE

if [ -z "$COURSE" ] || [ -z "$2" ]; then
  echo "Usage: $0 <course-name> <dpn-learning-center-path>"
  exit 1
fi

mkdir -p "$DST"
cp "$SRC"/* "$DST"/
echo "Copied assets to $DST"
echo ""
echo "Next steps:"
echo "  1. Add translated .md files to src/content/docs/$COURSE/"
echo "  2. Add sidebar entries to astro.config.mjs"
echo "  3. git push → GitHub Actions will auto-deploy"
