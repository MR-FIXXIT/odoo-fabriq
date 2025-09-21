from django.contrib import admin
from .models import DailyProductionKPI

@admin.register(DailyProductionKPI)
class DailyProductionKPIAdmin(admin.ModelAdmin):
    list_display = ('date', 'mos_completed', 'units_produced', 
                   'avg_lead_time_hours', 'on_time_completion_rate', 'updated_at')
    list_filter = ('date',)
    search_fields = ('date',)
    readonly_fields = ('updated_at',)
    
    fieldsets = (
        ('Date Information', {
            'fields': ('date',)
        }),
        ('Production Metrics', {
            'fields': ('mos_completed', 'units_produced')
        }),
        ('Performance Indicators', {
            'fields': ('avg_lead_time_hours', 'on_time_completion_rate')
        }),
        ('System Fields', {
            'fields': ('updated_at',),
            'classes': ('collapse',)
        })
    )

    def get_readonly_fields(self, request, obj=None):
        if obj:  # editing an existing object
            return self.readonly_fields + ('date',)
        return self.readonly_fields
