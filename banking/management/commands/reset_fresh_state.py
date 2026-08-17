from django.core.management.base import BaseCommand

from banking.bootstrap import seed_demo_data
from banking.models import (
    Account,
    AuditLog,
    AuthToken,
    CreditCard,
    Customer,
    FieldVisit,
    KYCDocument,
    Loan,
    StaffUser,
    Transaction,
)


class Command(BaseCommand):
    help = 'Reset the application to a fresh state with only the four default staff users.'

    def handle(self, *args, **options):
        AuthToken.objects.all().delete()
        CreditCard.objects.all().delete()
        Transaction.objects.all().delete()
        FieldVisit.objects.all().delete()
        Loan.objects.all().delete()
        KYCDocument.objects.all().delete()
        Account.objects.all().delete()
        Customer.objects.all().delete()
        AuditLog.objects.all().delete()

        StaffUser.objects.exclude(username__in=['field01', 'cse01', 'loan01', 'manager01']).delete()
        seed_demo_data()

        self.stdout.write(self.style.SUCCESS('Application reset to fresh state with default staff only.'))
