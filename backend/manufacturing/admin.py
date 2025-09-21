from django.contrib import admin
from .models import WorkCenter, BillOfMaterials, BOMItem, BOMOperation, ManufacturingOrder, WorkOrder

@admin.register(WorkCenter)
class WorkCenterAdmin(admin.ModelAdmin):
    list_display = ('name', 'capacity', 'cost_per_hour', 'location', 'created_at')
    search_fields = ('name', 'location')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(BillOfMaterials)
class BillOfMaterialsAdmin(admin.ModelAdmin):
    list_display = ('product', 'version', 'effective_from', 'created_at')
    list_filter = ('effective_from', 'version')
    search_fields = ('product__name', 'product__sku', 'version')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(BOMItem)
class BOMItemAdmin(admin.ModelAdmin):
    list_display = ('bom', 'component', 'qty_per_unit', 'scrap_pct')
    search_fields = ('bom__product__name', 'component__name')
    raw_id_fields = ('bom', 'component')

@admin.register(BOMOperation)
class BOMOperationAdmin(admin.ModelAdmin):
    list_display = ('bom', 'work_center', 'name', 'sequence', 'est_hours')
    list_filter = ('work_center',)
    search_fields = ('name', 'bom__product__name')
    ordering = ('bom', 'sequence')

@admin.register(ManufacturingOrder)
class ManufacturingOrderAdmin(admin.ModelAdmin):
    list_display = ('mo_number', 'product', 'qty', 'due_date', 'status', 'created_at')
    list_filter = ('status', 'due_date')
    search_fields = ('mo_number', 'product__name', 'notes')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('product', 'linked_bom')

@admin.register(WorkOrder)
class WorkOrderAdmin(admin.ModelAdmin):
    list_display = ('mo', 'operation_no', 'title', 'work_center', 'status', 'assigned_to')
    list_filter = ('status', 'work_center')
    search_fields = ('title', 'mo__mo_number', 'notes')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('mo', 'work_center', 'assigned_to')
