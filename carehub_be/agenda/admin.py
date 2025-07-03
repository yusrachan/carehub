from django.contrib import admin
from .models import Agenda

@admin.register(Agenda)
class AgendaAdmin(admin.ModelAdmin):
    list_display = ('patient', 'prescription', 'app_date', 'practitioner', 'status', 'payment_mode')
    list_filter = ('status', 'payment_mode')
    search_fields = ('patient__name',)