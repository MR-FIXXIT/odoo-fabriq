from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from .models import DailyProductionKPI

class KPITests(TestCase):
    def setUp(self):
        self.today = timezone.now().date()
        self.kpi = DailyProductionKPI.objects.create(
            date=self.today,
            mos_completed=5,
            units_produced=Decimal('100.00')
        )

    def test_kpi_calculations(self):
        """Test KPI metric calculations"""
        self.kpi.mos_completed += 3
        self.kpi.units_produced += Decimal('50.00')
        self.kpi.save()
        
        updated_kpi = DailyProductionKPI.objects.get(date=self.today)
        self.assertEqual(updated_kpi.mos_completed, 8)
        self.assertEqual(updated_kpi.units_produced, Decimal('150.00'))

    def test_date_validations(self):
        """Test date constraints and validations"""
        # Test future date
        future_date = self.today + timedelta(days=1)
        with self.assertRaises(Exception):
            DailyProductionKPI.objects.create(
                date=future_date,
                mos_completed=1,
                units_produced=Decimal('10.00')
            )