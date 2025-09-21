from django.contrib import admin
from .models import Product, StockLedgerEntry, StockBalance

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'sku', 'name', 'product_type', 'stock_quantity', 'unit_of_measure')
    list_filter = ('product_type',)
    search_fields = ('name', 'sku', 'description')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('sku', 'name', 'description', 'product_type')
        }),
        ('Stock Details', {
            'fields': ('stock_quantity', 'unit_of_measure', 'reorder_level', 'default_warehouse')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        })
    )

@admin.register(StockLedgerEntry)
class StockLedgerEntryAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'transaction_type', 'quantity_changed', 'new_stock_quantity', 'created_at')
    list_filter = ('transaction_type', 'created_at')
    search_fields = ('product__name', 'product__sku', 'notes')
    readonly_fields = ('created_at',)
    raw_id_fields = ('product', 'created_by')

@admin.register(StockBalance)
class StockBalanceAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'warehouse', 'qty_on_hand', 'reserved_qty')
    list_filter = ('warehouse',)
    search_fields = ('product__name', 'product__sku', 'warehouse')
    raw_id_fields = ('product',)
