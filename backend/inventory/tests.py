from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from .models import Product, StockBalance
from decimal import Decimal

class InventoryTests(APITestCase):
    def setUp(self):
        self.product_data = {
            'name': 'Test Product',
            'sku': 'TEST001',
            'product_type': 'RAW',
            'unit_of_measure': 'units',
            'stock_quantity': Decimal('10.00')
        }
        
    def test_create_product(self):
        """Test product creation"""
        product = Product.objects.create(**self.product_data)
        self.assertEqual(product.sku, 'TEST001')
        self.assertEqual(product.stock_quantity, Decimal('10.00'))
        
    def test_stock_balance(self):
        """Test stock balance tracking"""
        product = Product.objects.create(**self.product_data)
        balance = StockBalance.objects.create(
            product=product,
            warehouse='MAIN',
            qty_on_hand=Decimal('10.00')
        )
        self.assertEqual(balance.qty_on_hand, Decimal('10.00'))

class StockMovementTests(APITestCase):
    def setUp(self):
        self.product_data = {
            'name': 'Test Product',
            'sku': 'TEST001',
            'product_type': 'RAW',
            'unit_of_measure': 'units',
            'stock_quantity': Decimal('10.00')
        }
        self.product = Product.objects.create(**self.product_data)
        self.initial_balance = StockBalance.objects.create(
            product=self.product,
            warehouse='MAIN',
            qty_on_hand=Decimal('100.00')
        )

    def test_stock_movement(self):
        """Test stock movement and balance updates"""
        # Simulate stock reduction
        movement_qty = Decimal('-10.00')
        self.initial_balance.qty_on_hand += movement_qty
        self.initial_balance.save()
        
        updated_balance = StockBalance.objects.get(product=self.product)
        self.assertEqual(updated_balance.qty_on_hand, Decimal('90.00'))

    def test_multi_warehouse_balance(self):
        """Test balance tracking across warehouses"""
        secondary_balance = StockBalance.objects.create(
            product=self.product,
            warehouse='SECONDARY',
            qty_on_hand=Decimal('50.00')
        )
        
        total_stock = sum(
            StockBalance.objects.filter(product=self.product)
            .values_list('qty_on_hand', flat=True)
        )
        self.assertEqual(total_stock, Decimal('150.00'))
