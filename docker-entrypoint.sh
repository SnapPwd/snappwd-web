#!/bin/sh

# Inject environment variables into env.js
if [ ! -z "$API_URL" ]; then
  echo "window.config = { API_URL: \"$API_URL\" };" > /usr/share/nginx/html/env.js
fi

exec "$@"
