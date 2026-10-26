"""Gunicorn configuration for the MXXNLY Labs backend."""

import os

bind = "0.0.0.0:8000"
workers = int(os.getenv("GUNICORN_WORKERS", "3"))
threads = int(os.getenv("GUNICORN_THREADS", "2"))
worker_class = "gthread"
max_requests = 1000
max_requests_jitter = 100
timeout = 60
graceful_timeout = 30
keepalive = 5

accesslog = "-"
errorlog = "-"
loglevel = os.getenv("GUNICORN_LOG_LEVEL", "info")
access_log_format = '%(h)s "%(r)s" %(s)s %(b)s %(D)sµs'
proc_name = "mxxnly-labs"
