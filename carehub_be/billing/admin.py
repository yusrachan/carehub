from django.contrib import admin
from .models import PathologyCategory, PathologyDetail

@admin.register(PathologyCategory)
class PathologyCategoryAdmin(admin.ModelAdmin):
    list_display = ('code',)

@admin.register(PathologyDetail)
class PathologyAdmin(admin.ModelAdmin):
    list_display = ('category', 'session_number', 'code_presta')
    search_fields = ('code_presta',)
    list_filter = ('category', 'session_number')