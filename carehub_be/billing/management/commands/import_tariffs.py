import csv
from decimal import Decimal
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Count

from billing.models import PathologyCategory, PathologyDetail

class Command(BaseCommand):
    help ="Import/Upsert tarifss for a given year from CSV."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Purge les catégories et tarifs avant réimport")
        parser.add_argument("--year", type=int, default=None, help="Filtrer par année pour les PathologyDetail")
    

    @transaction.atomic
    def handle(self, *args, **options):
        year = options["year"]
        do_reset = options["reset"]

        if do_reset:
            deleted, _ = PathologyDetail.objects.filter(year=year).delete()
            self.stdout.write(self.style.WARNING(f"Purge des tarifs {year}: {deleted} lignes supprimées."))

            orphan_qs = PathologyCategory.objects.annotate(n=Count('agenda')).filter(n=0)
            if orphan_qs.exists():
                orphan_count = orphan_qs.count()
                orphan_qs.delete()
                self.stdout.write(self.style.WARNING(f"{orphan_count} catégories orphelines supprimées."))
            else:
                self.stdout.write("Aucune catégorie orpheline à supprimer.")

        CATEGORIES = [
            {"code": "PC", "label": "Pathologie courante"},
            {"code": "FA", "label": "Pathologie aiguë"},
            {"code": "FB", "label": "Pathologie chronique"},
            {"code": "Lymph", "label": "Pathologie lourde"},
            {"code": "Pallia", "label": "Palliatif"},
            {"code": "E", "label": "Post-natal"},
        ]

        if isinstance(CATEGORIES, list):
            cat_map = {c["code"]: c["label"] for c in CATEGORIES}
        else:
            cat_map = CATEGORIES

        cat_objs = {}
        for code, label in cat_map.items():
            obj, created = PathologyCategory.objects.update_or_create(
                code=code,
                defaults={"label": label},
            )
            cat_objs[code] = obj
            self.stdout.write(f"- {'créé' if created else 'mis à jour'} : {obj.code} → {obj.label}")

        TARIFS_2025 = [
            # --- PC ---
            dict(cat="PC", smin=1, smax=1, code="567011", dossier="567033",
                 presta="30.80", hon_dossier="7.19", total="37.99", remb_nb="31.74", remb_b="35.49", tm_nb="6.25", tm_b="2.50"),
            dict(cat="PC", smin=2, smax=9, code="567011", dossier=None,
                 presta="30.80", hon_dossier=None, total="30.80", remb_nb="24.55", remb_b="28.30", tm_nb="6.25", tm_b="2.50"),
            dict(cat="PC", smin=10, smax=18, code="560011", dossier=None,
                 presta="30.80", hon_dossier=None, total="30.80", remb_nb="24.55", remb_b="28.30", tm_nb="6.25", tm_b="2.50"),
            dict(cat="PC", smin=19, smax=None,code="560055", dossier=None,
                 presta="30.80", hon_dossier=None, total="30.80", remb_nb="24.55", remb_b="28.30", tm_nb="6.25", tm_b="2.50"),

            # --- FA ---
            dict(cat="FA", smin=1, smax=1, code="567276", dossier="563076",
                 presta="30.80", hon_dossier="32.86", total="63.66", remb_nb="58.16", remb_b="61.66", tm_nb="5.50", tm_b="2.00"),
            dict(cat="FA", smin=2, smax=60, code="567276", dossier=None,
                 presta="30.80", hon_dossier=None, total="30.80", remb_nb="25.20", remb_b="28.20", tm_nb="5.60", tm_b="2.60"),
            dict(cat="FA", smin=61, smax=80, code="563010", dossier=None,
                 presta="30.80", hon_dossier=None, total="25.67", remb_nb="21.37", remb_b="24.87", tm_nb="5.50", tm_b="2.00"),
            dict(cat="FA", smin=81, smax=None, code="563054", dossier=None,
                 presta="30.80", hon_dossier=None, total="30.80", remb_nb="25.62", remb_b="29.12", tm_nb="5.18", tm_b="2.68"),

            # --- FB ---
            dict(cat="FB", smin=1,  smax=1, code="563614", dossier="563673",
                 presta="30.80", hon_dossier="32.86", total="63.66", remb_nb="58.16", remb_b="61.66", tm_nb="5.50", tm_b="2.00"),
            dict(cat="FB", smin=2,  smax=60, code="563614", dossier=None,
                 presta="30.80", hon_dossier=None, total="30.80", remb_nb="25.20", remb_b="28.20", tm_nb="5.60", tm_b="2.60"),
            dict(cat="FB", smin=61, smax=80,  code="564270", dossier=None,
                 presta="25.67", hon_dossier=None, total="25.67", remb_nb="21.37", remb_b="24.87", tm_nb="5.50", tm_b="2.00"),
            dict(cat="FB", smin=81, smax=None,code="563651", dossier=None,
                 presta="30.80", hon_dossier=None, total="30.80", remb_nb="25.62", remb_b="29.12", tm_nb="5.18", tm_b="2.68"),

            # --- Lymph ---
            dict(cat="Lymph", smin=1, smax=1, code="—", dossier="—",
                 presta="30.80", hon_dossier="32.86", total="77.99", remb_nb="72.26", remb_b="75.99", tm_nb="5.73", tm_b="2.00"),
            dict(cat="Lymph", smin=2,  smax=60, code="—", dossier=None,
                 presta="30.80", hon_dossier=None, total="45.13", remb_nb="39.63", remb_b="43.13", tm_nb="5.50", tm_b="2.00"),

            # --- E (post-natal) ---
            dict(cat="E", smin=1, smax=1, code="560652", dossier="560711",
                 presta="30.80", hon_dossier="32.86", total="63.66", remb_nb="59.78", remb_b="62.28", tm_nb="3.88", tm_b="1.38"),
            dict(cat="E", smin=2, smax=None, code="561013", dossier=None,
                 presta="30.80", hon_dossier=None, total="30.80", remb_nb="29.42", remb_b="29.42", tm_nb="1.38", tm_b="1.38"),

            # --- Pallia ---
            dict(cat="Pallia", smin=1, smax=None, code="564211", dossier=None,
                 presta=None, hon_dossier=None, total=None, remb_nb=None, remb_b=None, tm_nb=None, tm_b=None),
        ]

        def D(x):
            # Montants: retourne Decimal('0.00') si vide/None/—/"/"
            if x in (None, "", "—", "/"):
                return Decimal("0.00")
            return Decimal(str(x).replace(",", "."))

        def S(x):
            # Codes texte: None si vide/— sinon str
            if x in (None, "", "—", "/"):
                return None
            return str(x)
        
        count = 0
        for row in TARIFS_2025:
            cat = cat_objs[row["cat"]]
            smax = row["smax"]

            PathologyDetail.objects.update_or_create(
                category=cat,
                year=year,
                place="office",
                session_min=row["smin"],
                session_max=smax,
                defaults=dict(
                    code_presta=S(row["code"]) or "",
                    code_dossier=S(row["dossier"]) or "",
                    hon_presta=D(row["presta"]),
                    hon_dossier=D(row["hon_dossier"]),
                    hon_total=D(row["total"]),
                    reimb_not_bim=D(row["remb_nb"]),
                    reimb_bim=D(row["remb_b"]),
                    tm_not_bim=D(row["tm_nb"]),
                    tm_bim=D(row["tm_b"]),
                ),
            )
            count += 1

        self.stdout.write(self.style.SUCCESS(f"{count} lignes tarifs {year} (cabinet) upsertées."))
