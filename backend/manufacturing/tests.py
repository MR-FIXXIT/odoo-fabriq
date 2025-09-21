from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from .models import WorkCenter, BillOfMaterials, ManufacturingOrder, WorkOrder
from inventory.models import Product
from account.models import CustomUser
from .services import ManufacturingService
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

class ManufacturingTests(APITestCase):
    def setUp(self):
        # Create test user
        self.user = CustomUser.objects.create_user(
            email='test@example.com',
            password='testpass123',
            loginid='testuser'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create test product
        self.product = Product.objects.create(
            name='Test Product',
            sku='TEST001',
            product_type='FINISHED',
            unit_of_measure='units'
        )
        
        # Create test work center
        self.work_center = WorkCenter.objects.create(
            name='Test WorkCenter',
            capacity=1,
            cost_per_hour=Decimal('10.00')
        )
        
        # Create test BOM
        self.bom = BillOfMaterials.objects.create(
            product=self.product,
            version='v1'
        )

    def test_create_bom(self):
        """Test BOM creation"""
        url = reverse('bom-list')
        data = {
            'product': self.product.id,
            'version': 'v1',
            'items': [
                {
                    'component': self.product.id,
                    'qty_per_unit': 1
                }
            ]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_manufacturing_order(self):
        """Test manufacturing order creation"""
        url = reverse('manufacturingorder-list')
        data = {
            'product': self.product.id,
            'qty': 10,
            'due_date': '2025-12-31'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_work_center_crud(self):
        """Test WorkCenter CRUD operations"""
        # Create
        url = reverse('workcenter-list')
        data = {
            'name': 'New WorkCenter',
            'capacity': 2,
            'cost_per_hour': '10.00'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Read
        work_center_id = response.data['id']
        response = self.client.get(f"{url}{work_center_id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Update
        data['capacity'] = 3
        response = self.client.put(f"{url}{work_center_id}/", data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Delete
        response = self.client.delete(f"{url}{work_center_id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_create_manufacturing_order_service(self):
        service = ManufacturingService()
        mo = service.create_manufacturing_order(
            product=self.product,
            quantity=10,
            due_date='2025-12-31'
        )
        
        self.assertIsNotNone(mo)
        self.assertEqual(mo.product, self.product)
        self.assertEqual(mo.qty, 10)

    def test_validate_bom_service(self):
        service = ManufacturingService()
        is_valid = service.validate_bom(self.bom)
        self.assertTrue(is_valid)

class WorkOrderTests(APITestCase):
    def setUp(self):
        # Create test user
        self.user = CustomUser.objects.create_user(
            email='test@example.com',
            password='testpass123',
            loginid='testuser'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create test product
        self.product = Product.objects.create(
            name='Test Product',
            sku='TEST001',
            product_type='FINISHED',
            unit_of_measure='units'
        )
        
        # Create test work center
        self.work_center = WorkCenter.objects.create(
            name='Test WorkCenter',
            capacity=1,
            cost_per_hour=Decimal('10.00')
        )
        
        # Create test BOM
        self.bom = BillOfMaterials.objects.create(
            product=self.product,
            version='v1'
        )

        # Create test manufacturing order
        self.mo = ManufacturingOrder.objects.create(
            product=self.product,
            qty=10,
            due_date=timezone.now().date() + timedelta(days=7)
        )

    def test_work_order_scheduling(self):
        """Test work order scheduling"""
        work_order = WorkOrder.objects.create(
            mo=self.mo,
            work_center=self.work_center,
            scheduled_start=timezone.now(),
            scheduled_end=timezone.now() + timedelta(hours=8)
        )
        self.assertEqual(work_order.status, 'SCHEDULED')

    def test_work_order_completion(self):
        """Test work order completion flow"""
        work_order = WorkOrder.objects.create(
            mo=self.mo,
            work_center=self.work_center
        )
        
        # Complete work order
        work_order.status = 'COMPLETED'
        work_order.actual_end = timezone.now()
        work_order.save()
        
        # Check MO status update
        self.mo.refresh_from_db()
        self.assertEqual(work_order.status, 'COMPLETED')

