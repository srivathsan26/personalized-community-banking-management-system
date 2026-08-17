from datetime import timedelta

from django.db import transaction as db_transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action, api_view, authentication_classes, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth import StaffTokenAuthentication
from .bootstrap import seed_demo_data
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
from .serializers import (
    AccountSerializer,
    AuditLogSerializer,
    CreditCardSerializer,
    CustomerSerializer,
    FieldVisitSerializer,
    KYCDocumentSerializer,
    LoanSerializer,
    StaffUserSerializer,
    TransactionSerializer,
)

LOAN_PRODUCTS = {
    'agriculture': {'interest_rate': 7.0, 'max_amount': 500000},
    'livestock': {'interest_rate': 8.5, 'max_amount': 200000},
    'business': {'interest_rate': 10.0, 'max_amount': 300000},
    'personal': {'interest_rate': 12.0, 'max_amount': 100000},
    'housing': {'interest_rate': 8.0, 'max_amount': 1000000},
}

CARD_PRODUCTS = {
    'classic': 25000,
    'gold': 50000,
    'platinum': 100000,
}


ROLE_LABELS = {
    'field_officer': 'Field Officer',
    'customer_service_executive': 'Customer Service Executive',
    'loan_officer': 'Loan Officer',
    'branch_manager': 'Branch Manager',
}


def staff_payload(staff_user: StaffUser) -> dict:
    return {
        'id': staff_user.id,
        'name': staff_user.name,
        'username': staff_user.username,
        'role': staff_user.role,
        'branchCode': staff_user.branch_code,
        'branchName': staff_user.branch_name,
        'employeeId': staff_user.employee_id,
        'assignedCustomers': staff_user.assigned_customers,
    }


def create_audit_log(action: str, entity_type: str, entity_id: str, performed_by: str, role: str, details: str) -> None:
    AuditLog.objects.create(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        performed_by=performed_by,
        performed_by_role=role,
        performed_at=timezone.now(),
        details=details,
        sync_status='synced',
    )


def require_roles(request, *allowed_roles: str) -> None:
    user_role = getattr(request.user, 'role', None)
    if user_role not in allowed_roles:
        allowed_labels = ', '.join(ROLE_LABELS.get(role, role) for role in allowed_roles)
        raise PermissionDenied(f'Access restricted to: {allowed_labels}.')


def calculate_loan_eligibility(customer: Customer, loan_amount: int) -> tuple[bool, int, int]:
    max_eligible_amount = max(25000, round(customer.annual_income * 0.6))
    risk_score = max(30, min(95, round((customer.annual_income / max(loan_amount, 1)) * 10)))
    return loan_amount <= max_eligible_amount, max_eligible_amount, risk_score


def calculate_emi(amount: int, annual_rate: float, tenure: int) -> int:
    monthly_rate = annual_rate / 12 / 100
    return round(amount * monthly_rate * ((1 + monthly_rate) ** tenure) / (((1 + monthly_rate) ** tenure) - 1))


def generate_repayment_schedule(amount: int, annual_rate: float, tenure: int, start_date):
    monthly_rate = annual_rate / 12 / 100
    emi_amount = calculate_emi(amount, annual_rate, tenure)
    outstanding = amount
    schedule = []
    for installment in range(1, tenure + 1):
        interest_component = round(outstanding * monthly_rate)
        principal_component = max(0, emi_amount - interest_component)
        outstanding = max(0, outstanding - principal_component)
        due_date = start_date + timedelta(days=30 * (installment - 1))
        schedule.append(
            {
                'installmentNumber': installment,
                'dueDate': due_date.isoformat(),
                'principalComponent': principal_component,
                'interestComponent': interest_component,
                'amount': emi_amount,
                'status': 'upcoming',
            }
        )
    return schedule


def apply_repayment_to_schedule(schedule: list[dict], repaid_amount: int) -> list[dict]:
    updated_schedule = []
    remaining_paid = repaid_amount
    for installment in schedule:
        installment_amount = int(installment.get('amount', 0))
        updated_installment = dict(installment)
        if remaining_paid >= installment_amount and installment_amount > 0:
            updated_installment['status'] = 'paid'
            remaining_paid -= installment_amount
        elif remaining_paid > 0:
            updated_installment['status'] = 'upcoming'
            remaining_paid = 0
        updated_schedule.append(updated_installment)
    return updated_schedule


def build_credit_card_statement(card: CreditCard, created_at=None) -> dict:
    statement_date = created_at or timezone.now()
    due_date = statement_date + timedelta(days=20)
    minimum_payment = max(500, round(card.outstanding_balance * 0.05)) if card.outstanding_balance else 0
    return {
        'statementDate': statement_date.isoformat(),
        'dueDate': due_date.isoformat(),
        'outstandingBalance': card.outstanding_balance,
        'minimumPayment': minimum_payment,
        'availableCredit': card.available_credit,
    }


class BaseViewSet(viewsets.ModelViewSet):
    authentication_classes = [StaffTokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]


class BootstrapView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        seed_demo_data()
        return Response({'status': 'ok'})


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip().lower()
        password = request.data.get('password', '')
        try:
            staff_user = StaffUser.objects.get(username=username, is_active=True)
        except StaffUser.DoesNotExist:
            create_audit_log(
                'authentication_failed',
                'auth',
                username or 'unknown',
                username or 'unknown',
                'anonymous',
                f'Failed login attempt for username "{username or "unknown"}"',
            )
            return Response({'detail': 'Invalid username or password.'}, status=status.HTTP_400_BAD_REQUEST)

        if not staff_user.check_password(password):
            create_audit_log(
                'authentication_failed',
                'auth',
                staff_user.id,
                staff_user.username,
                staff_user.role,
                f'Failed login attempt for username "{staff_user.username}"',
            )
            return Response({'detail': 'Invalid username or password.'}, status=status.HTTP_400_BAD_REQUEST)

        AuthToken.objects.filter(user=staff_user).delete()
        token = AuthToken.objects.create(user=staff_user)
        create_audit_log(
            'authentication_success',
            'auth',
            staff_user.id,
            staff_user.name,
            staff_user.role,
            f'User {staff_user.username} logged in successfully',
        )
        return Response({'token': token.key, 'user': staff_payload(staff_user)})


class MeView(APIView):
    authentication_classes = [StaffTokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({'user': staff_payload(request.user)})


class LogoutView(APIView):
    authentication_classes = [StaffTokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        AuthToken.objects.filter(user=request.user).delete()
        create_audit_log(
            'authentication_logout',
            'auth',
            request.user.id,
            request.user.name,
            request.user.role,
            f'User {request.user.username} logged out',
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class StaffUserViewSet(BaseViewSet):
    queryset = StaffUser.objects.all()
    serializer_class = StaffUserSerializer

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        require_roles(request, 'branch_manager')

    def perform_create(self, serializer):
        instance = serializer.save()
        create_audit_log(
            'user_created',
            'staff_user',
            instance.id,
            getattr(self.request.user, 'name', 'system'),
            getattr(self.request.user, 'role', 'branch_manager'),
            f'User {instance.username} created as {instance.role}',
        )

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        staff_user = self.get_object()
        if staff_user.id == getattr(request.user, 'id', None):
            return Response({'detail': 'Managers cannot reset their own password from this screen.'}, status=status.HTTP_400_BAD_REQUEST)

        new_password = request.data.get('new_password', '').strip()
        if len(new_password) < 6:
            return Response({'detail': 'New password must be at least 6 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

        staff_user.set_password(new_password)
        staff_user.save(update_fields=['password_hash'])
        AuthToken.objects.filter(user=staff_user).delete()
        create_audit_log(
            'password_reset',
            'staff_user',
            staff_user.id,
            getattr(request.user, 'name', 'system'),
            getattr(request.user, 'role', 'branch_manager'),
            f'Password reset for {staff_user.username} by manager',
        )
        return Response(self.get_serializer(staff_user).data)


class CustomerViewSet(BaseViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if request.method in permissions.SAFE_METHODS:
            require_roles(request, 'field_officer', 'customer_service_executive', 'loan_officer', 'branch_manager')
        else:
            require_roles(request, 'field_officer', 'customer_service_executive', 'branch_manager')

    def get_queryset(self):
        queryset = super().get_queryset()
        aadhaar = self.request.query_params.get('aadhaar_number')
        if aadhaar:
            queryset = queryset.filter(aadhaar_number=aadhaar)
        return queryset

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        require_roles(request, 'customer_service_executive', 'branch_manager')
        customer = self.get_object()
        customer.status = 'verified'
        customer.save(update_fields=['status'])
        create_audit_log(
            'customer_verified',
            'customer',
            customer.id,
            getattr(request.user, 'name', 'system'),
            getattr(request.user, 'role', 'branch_manager'),
            f'Customer {customer.first_name} {customer.last_name} verified',
        )
        return Response(CustomerSerializer(customer).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        require_roles(request, 'customer_service_executive', 'branch_manager')
        customer = self.get_object()
        customer.status = 'rejected'
        customer.save(update_fields=['status'])
        create_audit_log(
            'customer_rejected',
            'customer',
            customer.id,
            getattr(request.user, 'name', 'system'),
            getattr(request.user, 'role', 'branch_manager'),
            f'Customer {customer.first_name} {customer.last_name} rejected',
        )
        return Response(CustomerSerializer(customer).data)


class AccountViewSet(BaseViewSet):
    queryset = Account.objects.select_related('customer').all()
    serializer_class = AccountSerializer

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        require_roles(request, 'customer_service_executive', 'branch_manager')

    def get_queryset(self):
        queryset = super().get_queryset()
        customer_id = self.request.query_params.get('customer_id')
        account_number = self.request.query_params.get('account_number')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if account_number:
            queryset = queryset.filter(account_number=account_number)
        return queryset

    def perform_create(self, serializer):
        account = serializer.save()
        customer = account.customer
        if not customer.primary_account_id:
            customer.primary_account_id = account.id
            customer.account_number = account.account_number
            customer.account_balance = account.balance
            customer.save(update_fields=['primary_account_id', 'account_number', 'account_balance'])
        create_audit_log(
            'account_created',
            'account',
            account.id,
            getattr(self.request.user, 'name', 'system'),
            getattr(self.request.user, 'role', 'branch_manager'),
            f'Account {account.account_number} created for {account.customer_name}',
        )

    def perform_update(self, serializer):
        account = serializer.save()
        customer = account.customer
        if customer.primary_account_id == account.id:
            customer.account_number = account.account_number
            customer.account_balance = account.balance
            customer.save(update_fields=['account_number', 'account_balance'])


class KYCDocumentViewSet(BaseViewSet):
    queryset = KYCDocument.objects.select_related('customer').all()
    serializer_class = KYCDocumentSerializer

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if request.method in permissions.SAFE_METHODS:
            require_roles(request, 'field_officer', 'customer_service_executive', 'loan_officer', 'branch_manager')
        else:
            require_roles(request, 'field_officer', 'customer_service_executive')

    def get_queryset(self):
        queryset = super().get_queryset()
        customer_id = self.request.query_params.get('customer_id')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        return queryset


class LoanViewSet(BaseViewSet):
    queryset = Loan.objects.select_related('customer').all()
    serializer_class = LoanSerializer

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if request.method in permissions.SAFE_METHODS:
            require_roles(request, 'customer_service_executive', 'loan_officer', 'branch_manager')
        else:
            require_roles(request, 'loan_officer', 'branch_manager')

    def get_queryset(self):
        queryset = super().get_queryset()
        customer_id = self.request.query_params.get('customer_id')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        return queryset

    def create(self, request, *args, **kwargs):
        require_roles(request, 'loan_officer', 'branch_manager')
        customer_id = request.data.get('customer')
        loan_type = request.data.get('loan_type')
        amount = int(float(request.data.get('amount', 0)))
        tenure = int(request.data.get('tenure', 0))
        purpose = request.data.get('purpose') or ''

        if not customer_id or loan_type not in LOAN_PRODUCTS or amount <= 0 or tenure <= 0:
            return Response({'detail': 'Customer, valid loan type, amount, and tenure are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            customer = Customer.objects.get(pk=customer_id)
        except Customer.DoesNotExist:
            return Response({'detail': 'Customer not found.'}, status=status.HTTP_400_BAD_REQUEST)

        if customer.status != 'verified':
            return Response({'detail': 'Customer must be verified before loan application.'}, status=status.HTTP_400_BAD_REQUEST)
        if not customer.primary_account_id:
            return Response({'detail': 'Customer must have an account before loan application.'}, status=status.HTTP_400_BAD_REQUEST)

        product = LOAN_PRODUCTS[loan_type]
        if amount > product['max_amount']:
            return Response({'detail': f'Maximum amount for {loan_type} is Rs.{product["max_amount"]}.'}, status=status.HTTP_400_BAD_REQUEST)

        eligible, max_eligible_amount, risk_score = calculate_loan_eligibility(customer, amount)
        if not eligible:
            return Response({'detail': f'Loan exceeds eligibility limit of Rs.{max_eligible_amount}.'}, status=status.HTTP_400_BAD_REQUEST)

        first_repayment_date = timezone.now() + timedelta(days=30)
        loan = Loan.objects.create(
            customer=customer,
            customer_name=f'{customer.first_name} {customer.last_name}',
            loan_type=loan_type,
            amount=amount,
            interest_rate=product['interest_rate'],
            tenure=tenure,
            emi_amount=calculate_emi(amount, product['interest_rate'], tenure),
            status='pending',
            application_date=timezone.now(),
            purpose=purpose,
            repayment_schedule=generate_repayment_schedule(amount, product['interest_rate'], tenure, first_repayment_date),
            risk_score=risk_score,
            created_by=request.data.get('created_by') or getattr(request.user, 'id', 'system'),
            sync_status='synced',
        )
        create_audit_log(
            'loan_created',
            'loan',
            loan.id,
            getattr(request.user, 'name', 'system'),
            getattr(request.user, 'role', 'loan_officer'),
            f'Loan application for Rs.{loan.amount} created for customer {loan.customer_name}',
        )
        return Response(LoanSerializer(loan).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        require_roles(request, 'branch_manager')
        loan = self.get_object()
        if loan.status != 'pending':
            return Response({'detail': 'Only pending loans can be approved.'}, status=status.HTTP_400_BAD_REQUEST)

        loan.status = 'approved'
        loan.approved_by = getattr(request.user, 'id', 'system')
        loan.approved_at = timezone.now()
        loan.save(update_fields=['status', 'approved_by', 'approved_at'])
        create_audit_log(
            'loan_approved',
            'loan',
            loan.id,
            getattr(request.user, 'name', 'system'),
            getattr(request.user, 'role', 'branch_manager'),
            f'Loan {loan.id} approved for {loan.customer_name}',
        )
        return Response(LoanSerializer(loan).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        require_roles(request, 'branch_manager')
        loan = self.get_object()
        if loan.status not in ['pending', 'approved']:
            return Response({'detail': 'Only pending or approved loans can be rejected.'}, status=status.HTTP_400_BAD_REQUEST)

        loan.status = 'rejected'
        loan.rejected_by = getattr(request.user, 'id', 'system')
        loan.rejected_at = timezone.now()
        loan.rejection_reason = request.data.get('reason') or 'Rejected during manager review'
        loan.save(update_fields=['status', 'rejected_by', 'rejected_at', 'rejection_reason'])
        create_audit_log(
            'loan_rejected',
            'loan',
            loan.id,
            getattr(request.user, 'name', 'system'),
            getattr(request.user, 'role', 'branch_manager'),
            f'Loan {loan.id} rejected for {loan.customer_name}: {loan.rejection_reason}',
        )
        return Response(LoanSerializer(loan).data)

    @action(detail=True, methods=['post'])
    def disburse(self, request, pk=None):
        require_roles(request, 'branch_manager')
        loan = self.get_object()
        if loan.status != 'approved':
            return Response({'detail': 'Only approved loans can be disbursed.'}, status=status.HTTP_400_BAD_REQUEST)

        customer = loan.customer
        if not customer.primary_account_id:
            return Response({'detail': 'Customer needs a primary account before disbursement.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            account = Account.objects.get(pk=customer.primary_account_id, status='active')
        except Account.DoesNotExist:
            return Response({'detail': 'Active primary account not found.'}, status=status.HTTP_400_BAD_REQUEST)

        with db_transaction.atomic():
            account.balance += loan.amount
            account.save(update_fields=['balance'])

            customer.account_balance = account.balance
            customer.account_number = account.account_number
            customer.save(update_fields=['account_balance', 'account_number'])

            Transaction.objects.create(
                account=account,
                customer=customer,
                customer_name=loan.customer_name,
                account_number=account.account_number,
                type='deposit',
                amount=loan.amount,
                balance=account.balance,
                description=f'Loan disbursement for {loan.loan_type} loan',
                reference_id=loan.id,
                transaction_date=timezone.now(),
                created_by=getattr(request.user, 'id', 'system'),
                status='success',
                sync_status='synced',
            )

            loan.status = 'disbursed'
            loan.approved_by = loan.approved_by or getattr(request.user, 'id', 'system')
            loan.approved_at = loan.approved_at or timezone.now()
            loan.save(update_fields=['status', 'approved_by', 'approved_at'])

        create_audit_log(
            'loan_approved',
            'loan',
            loan.id,
            getattr(request.user, 'name', 'system'),
            getattr(request.user, 'role', 'branch_manager'),
            f'Loan {loan.id} disbursed into account {account.account_number}',
        )
        return Response(LoanSerializer(loan).data)

    @action(detail=True, methods=['post'])
    def repay(self, request, pk=None):
        require_roles(request, 'customer_service_executive', 'branch_manager')
        loan = self.get_object()
        if loan.status not in ['disbursed', 'approved']:
            return Response({'detail': 'Only approved or disbursed loans can receive repayments.'}, status=status.HTTP_400_BAD_REQUEST)

        amount = int(float(request.data.get('amount', 0)))
        if amount <= 0:
            return Response({'detail': 'Valid repayment amount is required.'}, status=status.HTTP_400_BAD_REQUEST)

        customer = loan.customer
        if not customer.primary_account_id:
            return Response({'detail': 'Customer must have a primary account for repayment.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            account = Account.objects.get(pk=customer.primary_account_id, status='active')
        except Account.DoesNotExist:
            return Response({'detail': 'Active primary account not found.'}, status=status.HTTP_400_BAD_REQUEST)

        if account.balance < amount:
            return Response({'detail': 'Insufficient balance for repayment.'}, status=status.HTTP_400_BAD_REQUEST)

        with db_transaction.atomic():
            account.balance -= amount
            account.save(update_fields=['balance'])
            customer.account_balance = account.balance
            customer.account_number = account.account_number
            customer.save(update_fields=['account_balance', 'account_number'])

            new_repaid_amount = min(loan.amount, loan.repaid_amount + amount)
            repayment_entry = {
                'paidAt': timezone.now().isoformat(),
                'amount': amount,
                'accountNumber': account.account_number,
                'recordedBy': getattr(request.user, 'name', 'system'),
            }
            updated_history = [*loan.repayment_history, repayment_entry]
            updated_schedule = apply_repayment_to_schedule(loan.repayment_schedule, new_repaid_amount)
            loan.repaid_amount = new_repaid_amount
            loan.repayment_history = updated_history
            loan.repayment_schedule = updated_schedule
            loan.last_payment_date = timezone.now()
            if new_repaid_amount >= loan.amount:
                loan.status = 'closed'
            loan.save(update_fields=['repaid_amount', 'repayment_history', 'repayment_schedule', 'last_payment_date', 'status'])

            Transaction.objects.create(
                account=account,
                customer=customer,
                customer_name=loan.customer_name,
                account_number=account.account_number,
                type='withdrawal',
                amount=amount,
                balance=account.balance,
                description=f'Loan repayment for {loan.id}',
                reference_id=loan.id,
                transaction_date=timezone.now(),
                created_by=getattr(request.user, 'id', 'system'),
                status='success',
                sync_status='synced',
            )

        create_audit_log(
            'loan_repayment_recorded',
            'loan',
            loan.id,
            getattr(request.user, 'name', 'system'),
            getattr(request.user, 'role', 'customer_service_executive'),
            f'Loan repayment of Rs.{amount} recorded for {loan.customer_name}',
        )
        return Response(LoanSerializer(loan).data)


class FieldVisitViewSet(BaseViewSet):
    queryset = FieldVisit.objects.select_related('customer', 'loan').all()
    serializer_class = FieldVisitSerializer

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if request.method in permissions.SAFE_METHODS:
            require_roles(request, 'field_officer', 'customer_service_executive', 'loan_officer', 'branch_manager')
        else:
            require_roles(request, 'field_officer', 'branch_manager')

    def get_queryset(self):
        queryset = super().get_queryset()
        customer_id = self.request.query_params.get('customer_id')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        return queryset


class AuditLogViewSet(BaseViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        require_roles(request, 'branch_manager')


class TransactionViewSet(BaseViewSet):
    queryset = Transaction.objects.select_related('account', 'customer').all()
    serializer_class = TransactionSerializer

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if request.method in permissions.SAFE_METHODS:
            require_roles(request, 'customer_service_executive', 'branch_manager')
        else:
            require_roles(request, 'customer_service_executive', 'branch_manager')

    def get_queryset(self):
        queryset = super().get_queryset()
        customer_id = self.request.query_params.get('customer_id')
        account_id = self.request.query_params.get('account_id')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if account_id:
            queryset = queryset.filter(account_id=account_id)
        return queryset

    def create(self, request, *args, **kwargs):
        account_id = request.data.get('account')
        transaction_type = request.data.get('type')
        amount = int(float(request.data.get('amount', 0)))
        description = request.data.get('description', '')
        to_account_number = request.data.get('to_account_number')

        if not account_id or not transaction_type or amount <= 0:
            return Response({'detail': 'Account, type, and valid amount are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if transaction_type == 'cash_collection':
            return Response({'detail': 'Cash collection is no longer supported in transaction processing.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            account = Account.objects.select_related('customer').get(pk=account_id)
        except Account.DoesNotExist:
            return Response({'detail': 'Account not found.'}, status=status.HTTP_400_BAD_REQUEST)

        customer = account.customer
        if account.status != 'active':
            return Response({'detail': 'Account must be active.'}, status=status.HTTP_400_BAD_REQUEST)
        if customer.status != 'verified':
            return Response({'detail': 'Linked customer must be verified.'}, status=status.HTTP_400_BAD_REQUEST)

        is_credit = transaction_type == 'deposit'
        destination_account = None
        if not is_credit and amount > account.balance:
            return Response({'detail': 'Insufficient balance.'}, status=status.HTTP_400_BAD_REQUEST)

        if transaction_type == 'transfer':
            if not to_account_number:
                return Response({'detail': 'Destination account is required for transfers.'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                destination_account = Account.objects.get(account_number=to_account_number, status='active')
            except Account.DoesNotExist:
                return Response({'detail': 'Destination account not found.'}, status=status.HTTP_400_BAD_REQUEST)
            if destination_account.id == account.id:
                return Response({'detail': 'Source and destination accounts must differ.'}, status=status.HTTP_400_BAD_REQUEST)

        with db_transaction.atomic():
            account.balance = account.balance + amount if is_credit else account.balance - amount
            account.save(update_fields=['balance'])

            customer.account_balance = account.balance
            customer.account_number = account.account_number
            customer.save(update_fields=['account_balance', 'account_number'])

            if destination_account:
                destination_account.balance += amount
                destination_account.save(update_fields=['balance'])
                destination_customer = destination_account.customer
                if destination_customer.primary_account_id == destination_account.id:
                    destination_customer.account_balance = destination_account.balance
                    destination_customer.account_number = destination_account.account_number
                    destination_customer.save(update_fields=['account_balance', 'account_number'])

            transaction_record = Transaction.objects.create(
                account=account,
                customer=customer,
                customer_name=f'{customer.first_name} {customer.last_name}',
                account_number=account.account_number,
                type=transaction_type,
                amount=amount,
                balance=account.balance,
                description=description or f'{transaction_type} transaction',
                to_account_number=destination_account.account_number if destination_account else to_account_number,
                transaction_date=timezone.now(),
                created_by=request.data.get('created_by') or getattr(request.user, 'id', 'system'),
                status='success',
                sync_status='synced',
            )

        create_audit_log(
            'transaction_completed',
            'transaction',
            transaction_record.id,
            getattr(request.user, 'name', 'system'),
            getattr(request.user, 'role', 'field_officer'),
            f'{transaction_type} of Rs.{amount} processed on {account.account_number}',
        )
        return Response(TransactionSerializer(transaction_record).data, status=status.HTTP_201_CREATED)


class CreditCardViewSet(BaseViewSet):
    queryset = CreditCard.objects.select_related('customer').all()
    serializer_class = CreditCardSerializer

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if request.method in permissions.SAFE_METHODS:
            require_roles(request, 'customer_service_executive', 'branch_manager')
        else:
            require_roles(request, 'customer_service_executive', 'branch_manager')

    def get_queryset(self):
        queryset = super().get_queryset()
        customer_id = self.request.query_params.get('customer_id')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        return queryset

    def create(self, request, *args, **kwargs):
        require_roles(request, 'customer_service_executive', 'branch_manager')
        customer_id = request.data.get('customer')
        card_type = request.data.get('card_type')
        if not customer_id or card_type not in CARD_PRODUCTS:
            return Response({'detail': 'Customer and valid card type are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            customer = Customer.objects.get(pk=customer_id)
        except Customer.DoesNotExist:
            return Response({'detail': 'Customer not found.'}, status=status.HTTP_400_BAD_REQUEST)

        if customer.status != 'verified':
            return Response({'detail': 'Customer must be verified for card application.'}, status=status.HTTP_400_BAD_REQUEST)
        if not customer.primary_account_id:
            return Response({'detail': 'Customer must have an active account for card application.'}, status=status.HTTP_400_BAD_REQUEST)

        eligible_limit = max(15000, round(customer.annual_income * 0.2))
        approved_limit = min(CARD_PRODUCTS[card_type], eligible_limit)
        card = CreditCard.objects.create(
            customer=customer,
            customer_name=f'{customer.first_name} {customer.last_name}',
            card_number=request.data.get('card_number') or f'4532{timezone.now().strftime("%f%S%M%H")}',
            card_type=card_type,
            credit_limit=approved_limit,
            available_credit=approved_limit,
            outstanding_balance=0,
            minimum_payment=0,
            due_date=timezone.now() + timedelta(days=30),
            expiry_date=timezone.now() + timedelta(days=365 * 3),
            status='pending_review',
            issued_date=timezone.now(),
            created_by=request.data.get('created_by') or getattr(request.user, 'id', 'system'),
            sync_status='synced',
        )
        create_audit_log(
            'card_issued',
            'credit_card',
            card.id,
            getattr(request.user, 'name', 'system'),
            getattr(request.user, 'role', 'customer_service_executive'),
            f'{card.card_type} application submitted for {card.customer_name}',
        )
        return Response(CreditCardSerializer(card).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        require_roles(request, 'branch_manager')
        card = self.get_object()
        if card.status != 'pending_review':
            return Response({'detail': 'Only pending cards can be approved.'}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        card.status = 'active'
        card.issued_date = now
        card.approved_by = getattr(request.user, 'id', 'system')
        card.approved_at = now
        card.available_credit = max(0, card.credit_limit - card.outstanding_balance)
        card.last_statement_date = now
        card.payment_reminder_date = card.due_date - timedelta(days=5)
        card.save(
            update_fields=[
                'status',
                'issued_date',
                'approved_by',
                'approved_at',
                'available_credit',
                'last_statement_date',
                'payment_reminder_date',
            ]
        )
        create_audit_log(
            'card_approved',
            'credit_card',
            card.id,
            getattr(request.user, 'name', 'system'),
            getattr(request.user, 'role', 'branch_manager'),
            f'Credit card {card.id} approved for {card.customer_name}',
        )
        return Response(CreditCardSerializer(card).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        require_roles(request, 'branch_manager')
        card = self.get_object()
        if card.status not in ['pending_review', 'active', 'inactive']:
            return Response({'detail': 'Card cannot be rejected in its current state.'}, status=status.HTTP_400_BAD_REQUEST)

        card.status = 'rejected'
        card.rejected_by = getattr(request.user, 'id', 'system')
        card.rejected_at = timezone.now()
        card.rejection_reason = request.data.get('reason') or 'Rejected during card review'
        card.save(update_fields=['status', 'rejected_by', 'rejected_at', 'rejection_reason'])
        create_audit_log(
            'card_rejected',
            'credit_card',
            card.id,
            getattr(request.user, 'name', 'system'),
            getattr(request.user, 'role', 'branch_manager'),
            f'Credit card {card.id} rejected for {card.customer_name}: {card.rejection_reason}',
        )
        return Response(CreditCardSerializer(card).data)

    @action(detail=True, methods=['post'])
    def add_transaction(self, request, pk=None):
        require_roles(request, 'customer_service_executive', 'branch_manager')
        card = self.get_object()
        if card.status != 'active':
            return Response({'detail': 'Only active cards can be used for transactions.'}, status=status.HTTP_400_BAD_REQUEST)

        amount = int(float(request.data.get('amount', 0)))
        merchant = (request.data.get('merchant') or '').strip()
        category = (request.data.get('category') or 'general').strip()
        if amount <= 0 or not merchant:
            return Response({'detail': 'Merchant and valid amount are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if amount > card.available_credit:
            return Response({'detail': 'Insufficient available credit.'}, status=status.HTTP_400_BAD_REQUEST)

        transaction_entry = {
            'id': f'cc_txn_{timezone.now().strftime("%Y%m%d%H%M%S%f")}',
            'amount': amount,
            'merchant': merchant,
            'category': category,
            'transactionDate': timezone.now().isoformat(),
            'status': 'completed',
        }
        card.transactions = [*card.transactions, transaction_entry]
        card.outstanding_balance += amount
        card.available_credit = max(0, card.credit_limit - card.outstanding_balance)
        card.minimum_payment = max(500, round(card.outstanding_balance * 0.05))
        card.save(update_fields=['transactions', 'outstanding_balance', 'available_credit', 'minimum_payment'])
        create_audit_log(
            'card_transaction_recorded',
            'credit_card',
            card.id,
            getattr(request.user, 'name', 'system'),
            getattr(request.user, 'role', 'customer_service_executive'),
            f'Credit card transaction of Rs.{amount} recorded for {card.customer_name} at {merchant}',
        )
        return Response(CreditCardSerializer(card).data)

    @action(detail=True, methods=['post'])
    def record_payment(self, request, pk=None):
        require_roles(request, 'customer_service_executive', 'branch_manager')
        card = self.get_object()
        amount = int(float(request.data.get('amount', 0)))
        if amount <= 0:
            return Response({'detail': 'Valid payment amount is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if amount > card.outstanding_balance:
            return Response({'detail': 'Payment amount exceeds outstanding balance.'}, status=status.HTTP_400_BAD_REQUEST)

        card.outstanding_balance -= amount
        card.available_credit = min(card.credit_limit, card.credit_limit - card.outstanding_balance)
        card.minimum_payment = max(0, max(500, round(card.outstanding_balance * 0.05)) if card.outstanding_balance else 0)
        card.transactions = [
            *card.transactions,
            {
                'id': f'cc_pay_{timezone.now().strftime("%Y%m%d%H%M%S%f")}',
                'amount': -amount,
                'merchant': 'Card Payment',
                'category': 'payment',
                'transactionDate': timezone.now().isoformat(),
                'status': 'completed',
            },
        ]
        card.save(update_fields=['outstanding_balance', 'available_credit', 'minimum_payment', 'transactions'])
        create_audit_log(
            'card_payment_recorded',
            'credit_card',
            card.id,
            getattr(request.user, 'name', 'system'),
            getattr(request.user, 'role', 'customer_service_executive'),
            f'Card payment of Rs.{amount} recorded for {card.customer_name}',
        )
        return Response(CreditCardSerializer(card).data)

    @action(detail=True, methods=['post'])
    def generate_statement(self, request, pk=None):
        require_roles(request, 'customer_service_executive', 'branch_manager')
        card = self.get_object()
        statement = build_credit_card_statement(card)
        card.statement_history = [*card.statement_history, statement]
        card.last_statement_date = timezone.now()
        card.due_date = timezone.now() + timedelta(days=20)
        card.payment_reminder_date = card.due_date - timedelta(days=5)
        card.minimum_payment = statement['minimumPayment']
        card.save(
            update_fields=[
                'statement_history',
                'last_statement_date',
                'due_date',
                'payment_reminder_date',
                'minimum_payment',
            ]
        )
        create_audit_log(
            'card_statement_generated',
            'credit_card',
            card.id,
            getattr(request.user, 'name', 'system'),
            getattr(request.user, 'role', 'customer_service_executive'),
            f'Credit card statement generated for {card.customer_name}',
        )
        return Response(CreditCardSerializer(card).data)


class DashboardStatsView(APIView):
    authentication_classes = [StaffTokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_roles(request, 'branch_manager')
        transactions = Transaction.objects.all()
        return Response(
            {
                'total_customers': Customer.objects.count(),
                'total_accounts': Account.objects.count(),
                'pending_kyc': Customer.objects.filter(status='pending').count(),
                'active_loans': Loan.objects.filter(status='disbursed').count(),
                'pending_loans': Loan.objects.filter(status='pending').count(),
                'scheduled_visits': FieldVisit.objects.filter(status__in=['scheduled', 'postponed']).count(),
                'sync_queue_count': 0,
                'today_collections': 0,
                'monthly_disbursements': Loan.objects.filter(status='disbursed').aggregate(total=Sum('amount'))['total'] or 0,
                'total_deposits': transactions.filter(type='deposit').aggregate(total=Sum('amount'))['total'] or 0,
                'total_withdrawals': transactions.filter(type='withdrawal').aggregate(total=Sum('amount'))['total'] or 0,
                'active_cards': CreditCard.objects.filter(status='active').count(),
            }
        )
