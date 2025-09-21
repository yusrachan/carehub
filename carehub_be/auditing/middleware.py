import uuid
import threading

from django.utils.deprecation import MiddlewareMixin

# Thread-local storage pour garder la requête courante accessible depuis n'importe quel endroit du code pendant la durée de la requête.
_thread_locals = threading.local()

def get_current_request():
    """
    Retourne la requête HTTP courante pour le thread en cours.
    Si aucune requête n'est en cours, renvoie None.
    
    Utile pour accéder à des informations de la requête (utilisateur connecté, IP, headers) dans des fonctions ou signaux où la request n'est pas directement passée.
    """
    return getattr(_thread_locals, "request", None)

def get_current_user():
    """
    Retourne l'utilisateur actuellement authentifié pour la requête courante.
    Renvoie None si aucune requête ou aucun utilisateur.
    
    Cela permet de savoir "qui a déclenché" une action sans devoir passer l'objet request partout.
    """
    req = get_current_request()
    return getattr(req, "user", None) if req else None

class RequestContextMiddleware(MiddlewareMixin):
    """
    Middleware pour stocker la requête courante dans un thread-local afin qu'elle soit accessible globalement dans le code (utils, signaux, etc.)

    Fonctionnalités :
    - Génère un identifiant unique pour chaque requête (request_id)
    - Permet d'accéder à la requête et à l'utilisateur actuel depuis n'importe quelle fonction du backend
    - Nettoie le thread-local après la réponse pour éviter les fuites de mémoire
    """

    def process_request(self, request):
        """
        Méthode appelée automatiquement par Django au début de chaque requête.

        - Génère un UUID unique pour la requête (request.request_id)
        - Stocke la requête dans le thread-local
        """

        request.request_id = uuid.uuid4().hex
        _thread_locals.request = request
    
    def process_response(self, request, response):
        """
        Méthode appelée automatiquement par Django après la réponse.

        - Nettoie la requête stockée dans le thread-local pour éviter les fuites mémoire dans les threads persistants
        - Retourne la réponse inchangée
        """

        _thread_locals.request = None
        return response