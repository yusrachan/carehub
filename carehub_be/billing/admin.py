from django.contrib import admin
from .models import PathologyCategory, PathologyDetail

@admin.register(PathologyCategory)
class PathologyCategoryAdmin(admin.ModelAdmin):
    list_display = ('code','label')
    search_fields = ('code','label')

@admin.register(PathologyDetail)
class PathologyAdmin(admin.ModelAdmin):
    list_display = (
        "year", "category", "place",
        "session_range",
        "code_presta", "code_dossier",
        "hon_presta", "hon_depla", "hon_dossier",
        "reimb_not_bim", "reimb_bim",
        "tm_not_bim", "tm_bim",
    )
    list_filter = ("year", "category", "place")
    search_fields = ("category__code", "category__label", "code_presta", "code_dossier")

    @admin.display(description="Quantième")
    def session_range(self, obj: PathologyDetail):
        if obj.session_max:
            return f"{obj.session_min}–{obj.session_max}"
        return f"{obj.session_min}+"