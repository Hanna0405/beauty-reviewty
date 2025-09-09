#!/usr/bin/env bash
set -e
B=${1:?Bucket required}; P=${2:?Path required}
ENC=$(python3 - <<PY
import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=""))
PY
"$P")
URL="https://firebasestorage.googleapis.com/v0/b/${B}/o?name=${ENC}&uploadType=resumable"
curl -i -X OPTIONS "${URL}" \
-H "Origin: http://localhost:3000" \
-H "Access-Control-Request-Method: POST" \
-H "Access-Control-Request-Headers: content-type,x-goog-upload-protocol,x-goog-upload-command,x-goog-upload-header-content-length,x-goog-upload-content-type"
