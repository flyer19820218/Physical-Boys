#!/bin/sh
# Whole image pipeline of lesson 4 (fungi), 2026-10-22.  Usage: run_all_fungi_1022.sh <work dir> <final dir>
# originals (the five Gemini jpegs) sit beside this script.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
W="$1"; F="$2"
rm -rf "$W"; mkdir -p "$W/raw" "$W/ref" "$W/fin"
python3 "$HERE/cut_fungi_1022.py" "$W/raw"                 # 1 matte + split (gray / white backdrops)
python3 "$HERE/refine_fungi_1022.py" "$W/raw" "$W/ref"     # 2 fill the slivers in the rhizoid junction
python3 "$HERE/defringe_fungi_1022.py" "$W/ref" "$W/fin" 3 # 3 take the light fringe off the edges
python3 "$HERE/finish_fungi_1022.py" "$W/fin" "$F"         # 4 sporangium halves + soil layers + sizes.json
