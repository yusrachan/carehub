from django.core.management.base import BaseCommand
import csv
from auditing.models import AuditEvent


class Command(BaseCommand):
    help = "Exporte les événements d’audit vers un fichier CSV."

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            type=str,
            default="audit_logs.csv",
            help="Chemin du fichier de sortie (par défaut: audit_logs.csv)",
        )

    def handle(self, *args, **options):
        output_file = options["output"]

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

        with open(output_file, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(fields)

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