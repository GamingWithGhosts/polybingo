#!/bin/sh
export C_FORCE_ROOT=true
export FLASK_APP=app

echo "Starting redis..."
redis &
echo "Starting celery worker and API backend...."
celery -A app.celery worker -l INFO & \
    flask run