from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class UserModelTest(TestCase):
    def test_create_user_with_role(self):
        user = User.objects.create_user(
            username='worker1',
            password='testpass123',
            role='worker',
            employee_id='EMP001',
        )
        self.assertEqual(user.role, 'worker')
        self.assertEqual(user.employee_id, 'EMP001')
        self.assertTrue(user.is_active)

    def test_create_admin_user(self):
        admin = User.objects.create_user(
            username='adminuser',
            password='adminpass123',
            role='admin',
        )
        self.assertEqual(str(admin), 'adminuser (admin)')

    def test_default_role_is_worker(self):
        user = User.objects.create_user(username='noroleset', password='pass1234')
        self.assertEqual(user.role, 'worker')
