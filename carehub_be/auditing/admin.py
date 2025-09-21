from django.contrib import admin

from .models import AuditEvent

@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    """
    Configuration du modèle AuditEvent dans le back-office Django Admin.

    - Empêche la création et la suppression d'événements (append-only).
    - Rend tous les champs en lecture seule.
    - Filtrage et recherche possibles pour faciliter l’audit.
    - Restreint la consultation aux superadmins et au groupe 'Auditors'.
    """

    list_display = ("created_at", "event_type", "actor", "target_user", "target_office_id", "request_id")
    list_filter = ("event_type", "created_at")
    search_fields = ("reason", "path", "user_agent", "request_id")
    readonly_fields = [f.name for f in AuditEvent._meta.fields]

    def has_add_permission(self, request):
        """
        Désactive la possibilité d’ajouter un AuditEvent manuellement depuis l’admin (les événements doivent être créés uniquement par le code applicatif via log_audit).
        """
        return False
    
    def has_delete_permission(self, request, obj=None):
        """
        Désactive la suppression d’événements d’audit, afin de garantir l’intégrité des logs (append-only).
        """
        return False
    
    def has_view_permission(self, request, obj=None):
        """
        Autorise uniquement :
        - les superutilisateurs
        - les membres du groupe 'Auditors'
        à consulter les événements d’audit.
        """
        return request.user.is_superuser or request.user.groups.filter(name="Auditors").exists()