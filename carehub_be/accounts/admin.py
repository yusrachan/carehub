from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserOfficeRole

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ['email', 'name', 'surname', 'is_staff', 'is_active']
    search_fields = ['email', 'name', 'surname']
    ordering = ['email']

    fieldsets = (
        (None, {'fields' : ('email', 'password')}),
        ('Informations personnelles', {'fields' : ('name', 'surname')}),
        ('Permissions', {'fields' : ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),   
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'surname', 'password1', 'password2', 'is_active', 'is_staff', 'is_superuser')
        })
    )

@admin.register(UserOfficeRole)
class UserOfficeRoleAdmin(admin.ModelAdmin):
    list_display = ['user', 'office', 'role']
    search_fields = ['user__email', 'office__name', 'role']
    list_filter = ['role']