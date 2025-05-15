from django.contrib import admin
from .models import Prescription

@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ('patient', 'pathology_category', 'pathology_detail', 'date_prescription', 'is_active')
    list_filter = ('pathology_category', 'is_active')
    search_fields = ('patient__name', 'pathology_category__code')