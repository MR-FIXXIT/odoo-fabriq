from django.db import models


class DailyProductionKPI(models.Model):
    date = models.DateField(
        unique=True, help_text="The date for which the KPIs are calculated."
    )

    mos_completed = models.PositiveIntegerField(
        default=0, help_text="Total Manufacturing Orders completed on this date."
    )
    units_produced = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        help_text="Total units of finished goods produced.",
    )

    avg_lead_time_hours = models.FloatField(
        default=0.0, help_text="Average time in hours from MO creation to completion."
    )
    on_time_completion_rate = models.FloatField(
        default=0.0,
        help_text="Percentage of MOs completed on or before their due date (0.0 to 1.0).",
    )

    # This timestamp tells us when the snapshot itself was created or last updated
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date"]
        verbose_name = "Daily Production KPI"
        verbose_name_plural = "Daily Production KPIs"

    def __str__(self):
        return f"KPIs for {self.date.strftime('%Y-%m-%d')}"
