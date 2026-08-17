from django.core.management.base import BaseCommand

from banking.bootstrap import seed_demo_data


class Command(BaseCommand):
    help = 'Seed demo banking data for local development.'

    def handle(self, *args, **options):
        seed_demo_data()
        self.stdout.write(self.style.SUCCESS('Demo data seeded successfully.'))
