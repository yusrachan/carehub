from django.db import models

class PathologyCategory(models.Model):
    code = models.CharField(max_length=10, unique=True)

    def __str__(self):
        return self.code

class PathologyDetail(models.Model):
    category = models.ForeignKey(PathologyCategory, on_delete=models.CASCADE)
    is_first_session = models.BooleanField(default=False)
    session_number = models.CharField(max_length=50)
    code_presta = models.CharField(max_length=20, blank=True, null=True)
    code_depla = models.CharField(max_length=20, blank=True, null=True)
    code_dossier = models.CharField(max_length=20, blank=True, null=True)
    honoraire_presta = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    honoraire_depla = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    honoraire_dossier = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)

    reimbursement_not_bim = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    reimbursement_bim = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    tm_not_bim = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    tm_bim = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)

    def __str__(self):
        return f"{self.category} - {self.session_number}"
    
    def calculate_invoice_data(self, is_bim: bool, is_first_session: bool):
        codes = [self.code_presta]
        total = self.honoraire_presta

        if is_first_session:
            total += self.honoraire_dossier
        
        reimbursement = self.reimbursement_bim if is_bim else self.reimbursement_not_bim
        tm = self.tm_bim if is_bim else self.tm_not_bim

        return{
            "codes_inami": codes,
            "total_honoraires": total,
            "remboursement": reimbursement,
            "tiers_payant": tm,
        }
