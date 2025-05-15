from django.db import models
from accounts.models import User
from patients.models import Patient
from billing.models import PathologyCategory, PathologyDetail

class Prescription(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="prescriptions")
    prescribed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    pathology_category = models.ForeignKey(PathologyCategory, on_delete=models.CASCADE)
    pathology_detail = models.ForeignKey(PathologyDetail, on_delete=models.CASCADE)
    date_prescription = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Prescription pour {self.patient} - {self.pathology_category.code}"
    
    def calculate_pricing(self, is_bim: bool, nb_sessions_done: int):
        """
        Calcule les infos tarifaires basées sur la prescription et le nombre de séances déjà réalisées.
        """
        from prescriptions.utils import get_session_number

        session_number = get_session_number(self.pathology_category.code, nb_sessions_done)
        is_first_session = (session_number == '1ère')

        try:
            pathology_detail = PathologyDetail.objects.get(
                category=self.pathology_category,
                session_number=session_number
            )
        except PathologyDetail.DoesNotExist:
            return None
        
        honoraires_total = pathology_detail.honoraire_presta or 0
        if is_first_session:
            honoraires_total += pathology_detail.honoraire_dossier or 0
        if pathology_detail.honoraire_depla:
            honoraires_total += pathology_detail.honoraire_depla
        
        return{
            "code_prestation": pathology_detail.code_presta,
            "code_dossier": pathology_detail.code_dossier if is_first_session else None,
            "honoraires_total": honoraires_total,
            "remboursement": pathology_detail.reimbursement_bim if is_bim else pathology_detail.reimbursement_not_bim,
            "tiers_payant": pathology_detail.tm_bim if is_bim else pathology_detail.tm_not_bim,
        }