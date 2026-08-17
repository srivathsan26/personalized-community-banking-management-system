from __future__ import annotations

import secrets
import string
from typing import Callable

from django.contrib.auth.hashers import check_password, make_password
from django.db import models


ALPHANUMERIC = string.ascii_uppercase + string.digits


def generate_unique_value(
    model: type[models.Model],
    field_name: str,
    factory: Callable[[], str],
) -> str:
    while True:
        value = factory()
        if not model.objects.filter(**{field_name: value}).exists():
            return value


def random_code(length: int = 8, alphabet: str = ALPHANUMERIC) -> str:
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def default_staff_id() -> str:
    return f"usr_{random_code(10, string.ascii_lowercase + string.digits)}"


def default_record_id(prefix: str) -> str:
    return f"{prefix}_{random_code(12, string.ascii_lowercase + string.digits)}"


EMPLOYEE_ROLE_PREFIXES = {
    'field_officer': 'FO',
    'customer_service_executive': 'CSE',
    'loan_officer': 'LO',
    'branch_manager': 'BM',
}


def generate_employee_id(role: str) -> str:
    role_prefix = EMPLOYEE_ROLE_PREFIXES.get(role, 'STF')

    def factory() -> str:
        return f"EMP-{role_prefix}-{random_code(6, string.digits)}"

    return generate_unique_value(StaffUser, 'employee_id', factory)


class StaffUser(models.Model):
    ROLE_CHOICES = [
        ('field_officer', 'Field Officer'),
        ('customer_service_executive', 'Customer Service Executive'),
        ('loan_officer', 'Loan Officer'),
        ('branch_manager', 'Branch Manager'),
    ]

    id = models.CharField(primary_key=True, max_length=40, default=default_staff_id, editable=False)
    username = models.CharField(max_length=150, unique=True)
    password_hash = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=64, choices=ROLE_CHOICES)
    branch_code = models.CharField(max_length=32)
    branch_name = models.CharField(max_length=255)
    employee_id = models.CharField(max_length=64)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=128, default='system')
    assigned_customers = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self) -> str:
        return f"{self.username} ({self.role})"

    def set_password(self, password: str) -> None:
        self.password_hash = make_password(password)

    def check_password(self, password: str) -> bool:
        return check_password(password, self.password_hash)

    def save(self, *args, **kwargs):
        if not self.employee_id:
            self.employee_id = generate_employee_id(self.role)
        return super().save(*args, **kwargs)

    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_anonymous(self) -> bool:
        return False


class AuthToken(models.Model):
    key = models.CharField(primary_key=True, max_length=64, editable=False)
    user = models.ForeignKey(StaffUser, on_delete=models.CASCADE, related_name='tokens')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = secrets.token_hex(24)
        return super().save(*args, **kwargs)


class Customer(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('verified', 'Verified'), ('rejected', 'Rejected')]
    GENDER_CHOICES = [('male', 'Male'), ('female', 'Female'), ('other', 'Other')]
    SYNC_CHOICES = [('pending', 'Pending'), ('synced', 'Synced'), ('failed', 'Failed')]

    id = models.CharField(primary_key=True, max_length=8, editable=False)
    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20)
    aadhaar_number = models.CharField(max_length=20, unique=True)
    address = models.TextField()
    village = models.CharField(max_length=120)
    district = models.CharField(max_length=120)
    state = models.CharField(max_length=120)
    pincode = models.CharField(max_length=12)
    occupation = models.CharField(max_length=120)
    annual_income = models.PositiveIntegerField()
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=16, choices=GENDER_CHOICES)
    created_at = models.DateTimeField()
    created_by = models.CharField(max_length=128)
    assigned_to = models.CharField(max_length=128, blank=True, null=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='pending')
    sync_status = models.CharField(max_length=16, choices=SYNC_CHOICES, default='synced')
    primary_account_id = models.CharField(max_length=64, blank=True, null=True)
    account_number = models.CharField(max_length=32, blank=True, null=True)
    account_balance = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = generate_unique_value(Customer, 'id', lambda: random_code(8))
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}"


class Account(models.Model):
    TYPE_CHOICES = [('savings', 'Savings'), ('current', 'Current'), ('fixed_deposit', 'Fixed Deposit')]
    STATUS_CHOICES = [('pending', 'Pending'), ('active', 'Active'), ('inactive', 'Inactive'), ('closed', 'Closed')]
    SYNC_CHOICES = [('pending', 'Pending'), ('synced', 'Synced'), ('failed', 'Failed')]

    id = models.CharField(primary_key=True, max_length=40, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='accounts')
    customer_name = models.CharField(max_length=255)
    account_number = models.CharField(max_length=32, unique=True)
    account_type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    balance = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='active')
    opened_at = models.DateTimeField()
    opened_by = models.CharField(max_length=128)
    approved_by = models.CharField(max_length=128, blank=True, null=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    sync_status = models.CharField(max_length=16, choices=SYNC_CHOICES, default='synced')

    class Meta:
        ordering = ['-opened_at']

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = default_record_id('acc')
        if not self.account_number:
            self.account_number = generate_unique_value(
                Account,
                'account_number',
                lambda: f"GB{random_code(10, string.digits)}",
            )
        return super().save(*args, **kwargs)


class KYCDocument(models.Model):
    TYPE_CHOICES = [
        ('aadhaar_front', 'Aadhaar Front'),
        ('aadhaar_back', 'Aadhaar Back'),
        ('selfie', 'Selfie'),
        ('signature', 'Signature'),
    ]
    STATUS_CHOICES = [('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')]
    SYNC_CHOICES = [('pending', 'Pending'), ('synced', 'Synced'), ('failed', 'Failed')]

    id = models.CharField(primary_key=True, max_length=40, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='kyc_documents')
    type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    file_name = models.CharField(max_length=255)
    file_data = models.TextField()
    uploaded_at = models.DateTimeField()
    uploaded_by = models.CharField(max_length=128)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='pending')
    sync_status = models.CharField(max_length=16, choices=SYNC_CHOICES, default='synced')

    class Meta:
        ordering = ['-uploaded_at']

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = default_record_id('kyc')
        return super().save(*args, **kwargs)


class Loan(models.Model):
    TYPE_CHOICES = [
        ('agriculture', 'Agriculture Loan'),
        ('livestock', 'Livestock Loan'),
        ('business', 'Micro Business Loan'),
        ('personal', 'Personal Loan'),
        ('housing', 'Rural Housing Loan'),
    ]
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('disbursed', 'Disbursed'),
        ('closed', 'Closed'),
        ('rejected', 'Rejected'),
    ]
    SYNC_CHOICES = [('pending', 'Pending'), ('synced', 'Synced'), ('failed', 'Failed')]

    id = models.CharField(primary_key=True, max_length=40, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='loans')
    customer_name = models.CharField(max_length=255)
    loan_type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    amount = models.PositiveIntegerField()
    interest_rate = models.FloatField()
    tenure = models.PositiveIntegerField()
    emi_amount = models.PositiveIntegerField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='pending')
    application_date = models.DateTimeField()
    approved_by = models.CharField(max_length=128, blank=True, null=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    rejected_by = models.CharField(max_length=128, blank=True, null=True)
    rejected_at = models.DateTimeField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    purpose = models.TextField(blank=True, null=True)
    repayment_schedule = models.JSONField(default=list, blank=True)
    repayment_history = models.JSONField(default=list, blank=True)
    repaid_amount = models.PositiveIntegerField(default=0)
    last_payment_date = models.DateTimeField(blank=True, null=True)
    risk_score = models.PositiveIntegerField(blank=True, null=True)
    created_by = models.CharField(max_length=128)
    sync_status = models.CharField(max_length=16, choices=SYNC_CHOICES, default='synced')

    class Meta:
        ordering = ['-application_date']

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = default_record_id('loan')
        return super().save(*args, **kwargs)


class FieldVisit(models.Model):
    TYPE_CHOICES = [
        ('pre_sanction', 'Pre-Sanction Verification'),
        ('post_sanction', 'Post-Sanction Inspection'),
        ('recovery', 'Recovery Visit'),
        ('verification', 'Document Verification'),
    ]
    STATUS_CHOICES = [('scheduled', 'Scheduled'), ('visited', 'Visited'), ('postponed', 'Postponed')]
    SYNC_CHOICES = [('pending', 'Pending'), ('synced', 'Synced'), ('failed', 'Failed')]

    id = models.CharField(primary_key=True, max_length=40, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='visits')
    customer_name = models.CharField(max_length=255)
    loan = models.ForeignKey(Loan, on_delete=models.SET_NULL, blank=True, null=True, related_name='visits')
    visit_type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    scheduled_date = models.DateTimeField()
    completed_date = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='scheduled')
    gps_latitude = models.FloatField(blank=True, null=True)
    gps_longitude = models.FloatField(blank=True, null=True)
    notes = models.TextField(blank=True, default='')
    photos = models.JSONField(default=list, blank=True)
    cash_collected = models.PositiveIntegerField(blank=True, null=True)
    created_by = models.CharField(max_length=128)
    sync_status = models.CharField(max_length=16, choices=SYNC_CHOICES, default='synced')

    class Meta:
        ordering = ['-scheduled_date']

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = default_record_id('visit')
        return super().save(*args, **kwargs)


class AuditLog(models.Model):
    SYNC_CHOICES = [('pending', 'Pending'), ('synced', 'Synced'), ('failed', 'Failed')]

    id = models.CharField(primary_key=True, max_length=40, editable=False)
    action = models.CharField(max_length=64)
    entity_type = models.CharField(max_length=64)
    entity_id = models.CharField(max_length=64)
    performed_by = models.CharField(max_length=255)
    performed_by_role = models.CharField(max_length=64)
    performed_at = models.DateTimeField()
    details = models.TextField()
    previous_value = models.TextField(blank=True, null=True)
    new_value = models.TextField(blank=True, null=True)
    sync_status = models.CharField(max_length=16, choices=SYNC_CHOICES, default='synced')

    class Meta:
        ordering = ['-performed_at']

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = default_record_id('audit')
        return super().save(*args, **kwargs)


class Transaction(models.Model):
    TYPE_CHOICES = [
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('transfer', 'Transfer'),
        ('cash_collection', 'Cash Collection'),
    ]
    STATUS_CHOICES = [('success', 'Success'), ('pending', 'Pending'), ('failed', 'Failed')]
    SYNC_CHOICES = [('pending', 'Pending'), ('synced', 'Synced'), ('failed', 'Failed')]

    id = models.CharField(primary_key=True, max_length=40, editable=False)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='transactions')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='transactions')
    customer_name = models.CharField(max_length=255)
    account_number = models.CharField(max_length=32)
    type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    amount = models.PositiveIntegerField()
    balance = models.PositiveIntegerField()
    description = models.TextField(blank=True, default='')
    reference_id = models.CharField(max_length=64, blank=True, null=True)
    to_account_number = models.CharField(max_length=32, blank=True, null=True)
    transaction_date = models.DateTimeField()
    created_by = models.CharField(max_length=128)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='success')
    sync_status = models.CharField(max_length=16, choices=SYNC_CHOICES, default='synced')

    class Meta:
        ordering = ['-transaction_date']

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = default_record_id('txn')
        return super().save(*args, **kwargs)


class CreditCard(models.Model):
    TYPE_CHOICES = [('classic', 'Classic'), ('gold', 'Gold'), ('platinum', 'Platinum')]
    STATUS_CHOICES = [
        ('pending_review', 'Pending Review'),
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('blocked', 'Blocked'),
        ('expired', 'Expired'),
        ('rejected', 'Rejected'),
    ]
    SYNC_CHOICES = [('pending', 'Pending'), ('synced', 'Synced'), ('failed', 'Failed')]

    id = models.CharField(primary_key=True, max_length=40, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='credit_cards')
    customer_name = models.CharField(max_length=255)
    card_number = models.CharField(max_length=32, unique=True)
    card_type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    credit_limit = models.PositiveIntegerField()
    available_credit = models.PositiveIntegerField()
    outstanding_balance = models.PositiveIntegerField(default=0)
    minimum_payment = models.PositiveIntegerField(default=0)
    due_date = models.DateTimeField()
    expiry_date = models.DateTimeField()
    status = models.CharField(max_length=24, choices=STATUS_CHOICES, default='pending_review')
    issued_date = models.DateTimeField()
    created_by = models.CharField(max_length=128)
    approved_by = models.CharField(max_length=128, blank=True, null=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    rejected_by = models.CharField(max_length=128, blank=True, null=True)
    rejected_at = models.DateTimeField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    last_statement_date = models.DateTimeField(blank=True, null=True)
    payment_reminder_date = models.DateTimeField(blank=True, null=True)
    transactions = models.JSONField(default=list, blank=True)
    statement_history = models.JSONField(default=list, blank=True)
    sync_status = models.CharField(max_length=16, choices=SYNC_CHOICES, default='synced')

    class Meta:
        ordering = ['-issued_date']

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = default_record_id('card')
        return super().save(*args, **kwargs)
