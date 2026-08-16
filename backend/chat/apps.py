import logging
import os
import sys
import threading

from django.apps import AppConfig

logger = logging.getLogger(__name__)


def is_serving() -> bool:
    """True only in a process that will actually answer questions.

    Management commands such as migrate load the apps too, and there is no
    point spending 400 MB on them. Under runserver's autoreloader only the
    child process serves, so the parent must not warm as well.
    """
    if 'gunicorn' in os.path.basename(sys.argv[0]):
        return True
    return 'runserver' in sys.argv and os.environ.get('RUN_MAIN') == 'true'


def warm_retrieval() -> None:
    """Load the embedding model before a visitor ever needs it.

    Imported in here rather than at the top of the file because importing
    langchain and torch is itself several seconds; running the whole thing in a
    thread keeps that off both the startup path and the first request.
    """
    try:
        from implementations.answer import retrieval

        retrieval()
    except Exception:
        logger.exception('could not warm retrieval, it will load on first use')


class ChatConfig(AppConfig):
    name = 'chat'

    def ready(self):
        # Retrieval loads lazily, so without this the first visitor to ask
        # something uncached waits about 16 seconds. Cached answers never wait
        # either way - they are served before any of this is touched.
        if is_serving():
            threading.Thread(target=warm_retrieval, name='warm-retrieval', daemon=True).start()
