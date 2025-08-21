from django.contrib import admin
from .models import Subscription

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "office",
        "paid_flag",
        "status_label",
        "period_end",
        "plan",
        "payment_status",
        "stripe_status",
    )
    search_fields = ("office__name", "stripe_customer_id", "stripe_subscription_id")
    list_filter = ("plan", "payment_status", "stripe_status", "state", "cancel_at_period_end")

    def paid_flag(self, obj):
        return obj.is_paid
    
    paid_flag.boolean = True
    paid_flag.short_description = "Payé"

    def status_label(self, obj):
        return obj.status
    
    status_label.short_description = "Statut"

    def period_end(self, obj):
        return obj.current_period_end
    
    period_end.admin_order_field = "end_date"
    period_end.short_description = "Fin de période"

    @admin.action(description="Marquer les abonnements comme payés")
    def mark_as_paid(self, request, queryset):
        updated = 0
        for subscription in queryset:
            if subscription.office:
                subscription.office.is_paid = True
                subscription.office.save()
                updated += 1
        self.message_user(request, f"{updated} cabinet(s) marqué(s) comme payé(s).")

    @admin.action(description="Marquer les abonnements comme non payés")
    def mark_as_unpaid(self, request, queryset):
        updated = 0
        for subscription in queryset:
            if subscription.office:
                subscription.office.is_paid = False
                subscription.office.save()
                updated += 1
        self.message_user(request, f"{updated} cabinet(s) marqué(s) comme non payé(s).")