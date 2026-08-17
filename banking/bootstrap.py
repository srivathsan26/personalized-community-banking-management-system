from __future__ import annotations

from django.db import transaction

from .models import StaffUser


DEFAULT_STAFF = [
    {
        'username': 'field01',
        'password': 'pass123',
        'name': 'Rajesh Kumar',
        'role': 'field_officer',
        'employee_id': 'EMP-FO-2024-001',
    },
    {
        'username': 'cse01',
        'password': 'pass123',
        'name': 'Priya Sharma',
        'role': 'customer_service_executive',
        'employee_id': 'EMP-CSE-2024-001',
    },
    {
        'username': 'loan01',
        'password': 'pass123',
        'name': 'Amit Patel',
        'role': 'loan_officer',
        'employee_id': 'EMP-LO-2024-001',
    },
    {
        'username': 'manager01',
        'password': 'pass123',
        'name': 'Suresh Menon',
        'role': 'branch_manager',
        'employee_id': 'EMP-BM-2024-001',
    },
]
@transaction.atomic
def seed_demo_data() -> None:
    existing_by_username = {staff.username: staff for staff in StaffUser.objects.all()}

    for item in DEFAULT_STAFF:
        staff_user = existing_by_username.get(item['username'])
        if staff_user is None:
            staff_user = StaffUser(username=item['username'])

        staff_user.name = item['name']
        staff_user.role = item['role']
        staff_user.branch_code = 'CB-TN-001'
        staff_user.branch_name = 'Chennai Main Branch'
        staff_user.employee_id = item['employee_id']
        staff_user.is_active = True
        staff_user.created_by = 'system'
        staff_user.assigned_customers = []
        staff_user.set_password(item['password'])
        staff_user.save()
