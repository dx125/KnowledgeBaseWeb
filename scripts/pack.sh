#!/usr/bin/env bash
# Build ../kb-web-upload.zip — this repo's source, for upload to an isolated sandbox —
# then list it and FAIL (deleting the archive) if it contains anything that must not
# leave this machine: dependencies, build output, real env files, or likely secrets.
#
#   bash scripts/pack.sh
#
# Contents: what git would commit (tracked files + new files not ignored by .gitignore;
# every file when there is no git checkout), minus the exclusions in `excluded` below.
# Needs bash plus one of zip / python3 (or python) / 7z, and unzip / python / 7z to verify.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
ROOT="$PWD"
OUT="$(cd .. && pwd)/kb-web-upload.zip"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

fail() {
  printf 'pack: FAILED — %b\n' "$1" >&2
  rm -f "$OUT"
  exit 1
}

# Paths that are never packed. Applied to the file list, then re-checked on the archive.
excluded() {
  case "/$1" in
    */node_modules | */node_modules/* | */dist | */dist/* | */coverage | */coverage/*) return 0 ;;
    */.git | */.git/* | */.vite | */.vite/*) return 0 ;;
    */.env.example | */.env.mock) return 1 ;; # the only env files allowed (no real values)
    */.env | */.env.*) return 0 ;;
    *.zip) return 0 ;;                           # no nested archives (stray exports, old uploads)
    *.log | */.DS_Store | *.tsbuildinfo) return 0 ;; # ignored by git anyway; matters without git
  esac
  return 1
}

PY=""
for candidate in python3 python; do
  if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -c 'import zipfile' >/dev/null 2>&1; then
    PY="$candidate"
    break
  fi
done
has() { command -v "$1" >/dev/null 2>&1; }

make_zip() { # <dir> <archive>
  if has zip; then
    (cd "$1" && zip -q -r -X "$2" .)
  elif [ -n "$PY" ]; then
    "$PY" - "$1" "$2" <<'PYZIP'
import os, sys, zipfile
src, out = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for d, dirs, files in os.walk(src):
        dirs.sort()
        for name in sorted(files):
            path = os.path.join(d, name)
            z.write(path, os.path.relpath(path, src).replace(os.sep, "/"))
PYZIP
  elif has 7z; then
    (cd "$1" && 7z a -tzip -bd "$2" . >/dev/null)
  else
    fail "need zip, python3 or 7z to create the archive"
  fi
}

zip_names() { # <archive> → one entry name per line
  if has unzip; then
    unzip -Z1 "$1"
  elif [ -n "$PY" ]; then
    "$PY" -c 'import sys, zipfile; print("\n".join(zipfile.ZipFile(sys.argv[1]).namelist()))' "$1" | tr -d '\r'
  else
    7z l -slt "$1" | sed -n 's/^Path = //p' | tail -n +2
  fi
}

zip_extract() { # <archive> <dir>
  if has unzip; then
    unzip -q "$1" -d "$2"
  elif [ -n "$PY" ]; then
    "$PY" -c 'import sys, zipfile; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])' "$1" "$2"
  else
    7z x -y -o"$2" "$1" >/dev/null
  fi
}

zip_listing() { # <archive>
  if has unzip; then
    unzip -l "$1"
  elif [ -n "$PY" ]; then
    "$PY" -c '
import sys, zipfile
infos = zipfile.ZipFile(sys.argv[1]).infolist()
for i in infos: print("%10d  %s" % (i.file_size, i.filename))
print("%10d  %d files" % (sum(i.file_size for i in infos), len(infos)))' "$1" | tr -d '\r'
  else
    7z l "$1"
  fi
}

list_files() {
  if git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git -C "$ROOT" ls-files -z --cached --others --exclude-standard
  else
    find . \( -name node_modules -o -name .git -o -name dist \) -prune -o -type f -print0
  fi
}

# --- 1. stage and zip --------------------------------------------------------------------
mkdir -p "$WORK/stage"
count=0
while IFS= read -r -d '' f; do
  f="${f#./}"
  [ -f "$f" ] || continue # tracked but deleted in the working tree
  excluded "$f" && continue
  mkdir -p "$WORK/stage/$(dirname "$f")"
  cp -p "$f" "$WORK/stage/$f"
  count=$((count + 1))
done < <(list_files)
[ "$count" -gt 0 ] || fail "nothing to pack"

rm -f "$OUT"
make_zip "$WORK/stage" "$OUT"

# --- 2. list -------------------------------------------------------------------------------
echo "Archive: $OUT"
zip_listing "$OUT"

# --- 3. verify the archive itself ----------------------------------------------------------
names="$(zip_names "$OUT")"

bad_paths=""
while IFS= read -r name; do
  [ -n "$name" ] || continue
  if excluded "${name%/}"; then bad_paths+="  $name"$'\n'; fi
done <<<"$names"
[ -z "$bad_paths" ] || fail "excluded paths found in the archive:\n$bad_paths"

for required in .gitignore .env.example .env.mock package.json package-lock.json public/mockServiceWorker.js; do
  grep -qxF "$required" <<<"$names" || fail "expected file missing from the archive: $required"
done

mkdir -p "$WORK/check"
zip_extract "$OUT" "$WORK/check"
scan() { (cd "$WORK/check" && grep -rnI "$@" . 2>/dev/null) || true; }

# The patterns are spelled so that this script does not match itself.
JWT_RE='eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}' # header.payload of a JWT (Supabase keys)
KEY_RE='SUPABASE[_]SERVICE|sb[_]secret[_]|postgres(ql)?://[^[:space:]:/@]+:[^[:space:]@/]+@'
ROLE="service""_role"

hits="$(scan -E "$JWT_RE")"$'\n'"$(scan -iE "$KEY_RE")"
# The role name is allowed only as `backticked` prose in Markdown (the docs mention the
# Postgres role); anywhere else — code, config, env files — it fails the pack.
while IFS= read -r line; do
  [ -n "$line" ] || continue
  file="${line%%:*}"
  text="${line#*:}"
  text="${text#*:}"
  if [[ "$file" == *.md ]]; then
    rest="${text//\`$ROLE\`/}"
    grep -qi "$ROLE" <<<"$rest" || continue
  fi
  hits+=$'\n'"$line"
done <<<"$(scan -i "$ROLE")"

if [ -n "${hits//[[:space:]]/}" ]; then
  locations="$(printf '%s\n' "$hits" | sed '/^$/d' | cut -d: -f1,2 | sed 's|^\./|  |' | sort -u)"
  fail "likely secrets in the archive (file:line):\n$locations"
fi

echo
echo "OK: $count files packed into $OUT"
echo "    no dependencies, build output, real env files or likely secrets found."
