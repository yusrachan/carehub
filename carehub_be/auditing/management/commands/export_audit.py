from django.core.management.base import BaseCommand
import csv
from auditing.models import AuditEvent


class Command(BaseCommand):
    """
    Commande Django personnalisée pour exporter les événements d’audit
    de la base de données vers un fichier CSV.

    Chaque ligne du CSV correspond à un événement d’audit (AuditEvent).
    Les colonnes incluent les métadonnées (date, type, acteur, cible, IP, etc.).
    Fichier généré par défaut : audit_logs.csv

    Exemple d’exécution :
        python manage.py export_audit --output=logs.csv
    """

    help = "Exporte les événements d’audit vers un fichier CSV."

    def add_arguments(self, parser):
        """
        Définition des arguments optionnels de la commande.
        Ici : --output pour indiquer le chemin du fichier de sortie.
        """

        parser.add_argument(
            "--output",
            type=str,
            default="audit_logs.csv",
            help="Chemin du fichier de sortie (par défaut: audit_logs.csv)",
        )

    def handle(self, *args, **options):
        """
        Fonction principale exécutée quand la commande est lancée.
        - Récupère le chemin du fichier de sortie (--output).
        - Définit les colonnes du CSV.
        - Exporte tous les événements d’audit triés par date décroissante.
        """

        output_file = options["output"]

         # Liste des colonnes du fichier CSV
        fields = [
            "created_at",
            "event_type",
            "actor_id",
            "target_user_id",
            "target_office_id",
            "office_context_id",
            "path",
            "method",
            "ip_address",
            "user_agent",
            "request_id",
            "reason",
            "before",
            "after",
        ]

        # Ouverture/Création du fichier CSV en écriture
        with open(output_file, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(fields) # Écriture de l’en-tête (colonnes)

            # Parcours de tous les événements d’audit, du plus récent au plus ancien
            for event in AuditEvent.objects.all().order_by("-created_at"):
                writer.writerow([
                    event.created_at,
                    event.event_type,
                    event.actor_id,
                    event.target_user_id,
                    event.target_office_id,
                    event.office_context_id,
                    event.path,
                    event.method,
                    event.ip_address,
                    event.user_agent,
                    event.request_id,
                    event.reason,
                    event.before,
                    event.after,
                ])

        self.stdout.write(self.style.SUCCESS(f"Export terminé: {output_file}"))