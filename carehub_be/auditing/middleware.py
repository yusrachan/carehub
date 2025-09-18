import uuid
import threading

from django.utils.deprecation import MiddlewareMixin

_thread_locals = threading.local()

def get_current_request():
    return getattr(_thread_locals, "request", None)

def get_current_user():
    req = get_current_request()
    return getattr(req, "user", None) if req else None

class RequestContextMiddleware(MiddlewareMixin):
    """
    Stocke la request courrante dans un threadlocal pour la lire ailleurs.
    """

    def process_request(self, request):
        request.request_id = uuid.uuid4().hex
        _thread_locals.request = request
    
    def process_response(self, request, response):
        _thread_locals.request = None
        return response