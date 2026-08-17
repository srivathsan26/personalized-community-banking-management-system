from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AccountViewSet,
    AuditLogViewSet,
    BootstrapView,
    CreditCardViewSet,
    CustomerViewSet,
    DashboardStatsView,
    FieldVisitViewSet,
    KYCDocumentViewSet,
    LoanViewSet,
    LoginView,
    LogoutView,
    MeView,
    StaffUserViewSet,
    TransactionViewSet,
)

router = DefaultRouter()
router.register('staff-users', StaffUserViewSet, basename='staff-user')
router.register('customers', CustomerViewSet, basename='customer')
router.register('accounts', AccountViewSet, basename='account')
router.register('kyc-documents', KYCDocumentViewSet, basename='kyc-document')
router.register('loans', LoanViewSet, basename='loan')
router.register('visits', FieldVisitViewSet, basename='visit')
router.register('audit-logs', AuditLogViewSet, basename='audit-log')
router.register('transactions', TransactionViewSet, basename='transaction')
router.register('credit-cards', CreditCardViewSet, basename='credit-card')

urlpatterns = [
    path('bootstrap/', BootstrapView.as_view(), name='bootstrap'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('', include(router.urls)),
]
