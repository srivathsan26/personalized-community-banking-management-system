from django.contrib import admin

from .models import (
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

admin.site.register(StaffUser)
admin.site.register(AuthToken)
admin.site.register(Customer)
admin.site.register(Account)
admin.site.register(KYCDocument)
admin.site.register(Loan)
admin.site.register(FieldVisit)
admin.site.register(AuditLog)
admin.site.register(Transaction)
admin.site.register(CreditCard)
