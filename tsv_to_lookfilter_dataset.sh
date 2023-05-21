#!/bin/bash

fnm="$1"
prefix="$2"
tmp_fnm="/tmp/tmp1.tsv"

cat "$fnm" | head -1 > "$tmp_fnm"
cat "$fnm" | tail -n+2  >> "$tmp_fnm"
cat "$tmp_fnm" | python3 "$ANALYTICS_DIR""tsv_to_json.py" |
python3 json_to_results_json.py "$prefix"