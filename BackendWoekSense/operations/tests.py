from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Task

User = get_user_model()


class TaskModelTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin2', password='pass1234', role='admin')
        self.worker = User.objects.create_user(username='worker3', password='pass1234', role='worker')

    def test_create_task(self):
        task = Task.objects.create(
            title='Install equipment',
            priority='high',
            status='pending',
            assigned_to=self.worker,
            created_by=self.admin,
        )
        self.assertIn('HIGH', str(task))
        self.assertEqual(task.assigned_to, self.worker)

    def test_default_status_is_pending(self):
        task = Task.objects.create(title='Check site', created_by=self.admin)
        self.assertEqual(task.status, 'pending')
