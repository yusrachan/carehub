from django.core.management.base import BaseCommand
from django.utils import timezone
from auditing.models import AuditEvent
import datetime


class Command(BaseCommand):
    """
    Commande Django personnalisée permettant de supprimer les événements d’audit trop anciens dans la base de données.

    Par défaut, les événements de plus d'un an (365 jours) sont supprimés.
    Je peux changer cette durée avec l’argument --days.
    Exemple d’exécution :
        python manage.py cleanup_audit --days=180
    """

    help = "Supprime les événements d’audit plus vieux que N jours."

    def add_arguments(self, parser):
        """
        Définition des arguments que la commande peut recevoir.
        Ici : un argument optionnel --days pour choisir combien de jours garder.
        """
        
        parser.add_argument(
            "--days",
            type=int,
            default=365,
            help="Nombre de jours à conserver (par défaut: 365)",
        )

    def handle(self, *args, **options):
        """
        Fonction principale exécutée quand la commande est lancée.
        - Calcule la date limite (cutoff_date).
        - Supprime tous les événements plus anciens que cette date.
        - Affiche combien d’événements ont été supprimés.
        """

        days = options["days"] # Récupération de la valeur transmise
        cutoff_date = timezone.now() - datetime.timedelta(days=days) # Date limite : aujourd'hui - N jours

        qs = AuditEvent.objects.filter(created_at__lt=cutoff_date) # Sélection de tous les événements plus anciens que cette date
        count = qs.count()
        qs.delete()

        self.stdout.write(self.style.SUCCESS(f"{count} événements supprimés (plus vieux que {days} jours)."))