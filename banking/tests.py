from django.test import TestCase

from .bootstrap import seed_demo_data
from .models import StaffUser


class BootstrapTests(TestCase):
    def test_seed_demo_data_creates_default_staff(self):
        seed_demo_data()

        usernames = set(StaffUser.objects.values_list('username', flat=True))

        self.assertTrue({'field01', 'cse01', 'loan01', 'manager01'}.issubset(usernames))

    def test_seed_demo_data_repairs_existing_default_staff(self):
        seed_demo_data()
        staff_user = StaffUser.objects.get(username='manager01')

        staff_user.name = 'Wrong Manager'
        staff_user.role = 'field_officer'
        staff_user.branch_code = 'CB-KA-002'
        staff_user.branch_name = 'Mysuru Branch'
        staff_user.employee_id = 'EMP-FO-TEST-001'
        staff_user.is_active = False
        staff_user.save()

        seed_demo_data()

        staff_user.refresh_from_db()
        self.assertEqual(staff_user.name, 'Suresh Menon')
        self.assertEqual(staff_user.role, 'branch_manager')
        self.assertEqual(staff_user.branch_code, 'CB-TN-001')
        self.assertEqual(staff_user.branch_name, 'Chennai Main Branch')
        self.assertEqual(staff_user.employee_id, 'EMP-BM-2024-001')
        self.assertTrue(staff_user.is_active)
        self.assertTrue(staff_user.check_password('pass123'))

    def test_seed_demo_data_is_idempotent_for_default_staff_count(self):
        seed_demo_data()
        first_count = StaffUser.objects.count()

        seed_demo_data()

        self.assertEqual(StaffUser.objects.count(), first_count)
