from django.db import models

class PathologyCategory(models.Model):
    code = models.CharField(max_length=10, unique=True)
    label = models.CharField(max_length=120, default="Unknown")

    def __str__(self):
        return self.code

class PathologyDetail(models.Model):
    PLACE_CHOICES = [
        ("home", "Domicile"),
        ("office", "Cabinet"),
    ]

    year = models.PositiveIntegerField(null=True, blank=True)
    category = models.ForeignKey(PathologyCategory, on_delete=models.CASCADE)
    session_label = models.CharField(max_length=20, blank=True, default="")
    place = models.CharField(max_length=10, choices=PLACE_CHOICES, default="home")

    session_min = models.PositiveIntegerField(null=True, blank=True)
    session_max = models.PositiveIntegerField(null=True, blank=True)

    code_presta = models.CharField(max_length=20, blank=True, null=True)
    code_depla = models.CharField(max_length=20, blank=True, null=True)
    code_dossier = models.CharField(max_length=20, blank=True, null=True)

    hon_presta = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    hon_depla = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    hon_dossier = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    hon_total = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    reimb_not_bim = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    reimb_bim = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    tm_not_bim = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    tm_bim = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["year", "category", "session_min", "session_max", "place"],
                name="uniq_tariff_span_per_year_category_place",
            )
        ]
        ordering = ["year", "category__code", "place", "session_min"]

    def __str__(self):
        return f"{self.category} - {self.session_number}"
    
    def calculate_invoice_data(self, is_bim: bool, is_first_session: bool):
        total = (self.hon_presta or 0) + (self.hon_depla or 0)
        if is_first_session:
            total += (self.hon_dossier or 0)

        reimbursement = self.reimb_bim if is_bim else self.reimb_not_bim
        tm = self.tm_bim if is_bim else self.tm_not_bim

        return {
            "codes_inami": [c for c in [self.code_presta, (self.code_dossier if is_first_session else None)] if c],
            "total_honoraires": total,
            "remboursement": reimbursement,
            "tiers_payant": tm,
        }
