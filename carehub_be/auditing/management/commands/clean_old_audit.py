from django.core.management.base import BaseCommand
from django.utils import timezone
from auditing.models import AuditEvent
import datetime


class Command(BaseCommand):
    help = "Supprime les événements d’audit plus vieux que N jours."

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=365,
            help="Nombre de jours à conserver (par défaut: 365)",
        )

    def handle(self, *args, **options):
        days = options["days"]
        cutoff_date = timezone.now() - datetime.timedelta(days=days)

        qs = AuditEvent.objects.filter(created_at__lt=cutoff_date)
        count = qs.count()
        qs.delete()

        self.stdout.write(self.style.SUCCESS(f"{count} événements supprimés (plus vieux que {days} jours)."))