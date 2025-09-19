from django.contrib import admin

from .models import AuditEvent

@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ("created_at", "event_type", "actor", "target_user", "target_office_id", "request_id")
    list_filter = ("event_type", "created_at")
    search_fields = ("reason", "path", "user_agent", "request_id")
    readonly_fields = [f.name for f in AuditEvent._meta.fields]

    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser or request.user.groups.filter(name="Auditors").exists()