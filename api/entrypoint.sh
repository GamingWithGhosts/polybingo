#!/bin/sh
export C_FORCE_ROOT=true
export FLASK_APP=app

echo "Starting redis..."
/etc/init.d/redis-server start &
echo "Starting celery worker and API backend...."
celery -A app.celery worker -l INFO --concurrency=4 & \
    python3 -m flask run --host=0.0.0.0
