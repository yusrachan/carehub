from django.db import models
from django.conf import settings

class AuditEvent(models.Model):
    """
    Modèle append-only (jamais modifié/supprimé après insertion) permettant de tracer toutes les actions sensibles effectuées dans l’application.

    Chaque enregistrement représente un événement d’audit avec :
    - Type d’événement (LOGIN, LOGOUT, ROLE_GRANTED, etc.)
    - Acteur (utilisateur qui a déclenché l’action)
    - Cible (utilisateur ou cabinet affecté)
    - Contexte (requête HTTP, IP, user-agent, etc.)
    - État avant/après (pour garder une trace des modifications)
    """

    EVENT_TYPES = [
        ("USER_DESACTIVATED", "User desactivated"),
        ("USER_REACTIVATED", "User reactivated"),
        ("ROLE_REVOKED", "Role revoked"),
        ("ROLE_GRANTED", "Role granted"),
        ("OFFICE_ARCHIVED", "Office archived"),
        ("OFFICE_UNARCHIVED", "Office unarchived"),
        ("LOGIN", "Login"),
        ("LOGOUT", "Logout"),
    ]

    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)

    #Qui a fait l'action
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="audit_actor_events"
    )

    #Sur quoi/qui
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="audit_target_user_events"
    )
    target_office_id = models.IntegerField(null=True, blank=True)

    office_context_id = models.IntegerField(null=True, blank=True)
    path = models.CharField(max_length=512, blank=True, default="")
    method = models.CharField(max_length=10, blank=True, default="")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    request_id = models.CharField(max_length=64, blank=True, default="")
    reason = models.TextField(blank=True, default="")
    before = models.JSONField(null=True, blank=True)
    after = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Index pour accélérer les recherches fréquentes
        indexes = [
            models.Index(fields=["event_type", "created_at"]),
            models.Index(fields=["target_office_id", "created_at"]),
            models.Index(fields=["target_user", "created_at"]),
        ]

    def __str__(self):
        """
        Représentation lisible d’un événement d’audit
        Exemple : [2025-09-19 14:30:22] LOGIN
        """
        return f"[{self.created_at:%Y-%m-%d %H:%M:%S}] {self.event_type}"