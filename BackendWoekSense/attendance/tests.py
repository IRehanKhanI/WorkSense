from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import AttendanceRecord

User = get_user_model()


class AttendanceModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='worker2', password='pass1234', role='worker')

    def test_create_attendance_record(self):
        today = timezone.localdate()
        record = AttendanceRecord.objects.create(
            user=self.user,
            date=today,
            clock_in=timezone.now(),
            status='present',
        )
        self.assertEqual(record.status, 'present')
        self.assertIsNone(record.clock_out)

    def test_unique_per_day(self):
        today = timezone.localdate()
        AttendanceRecord.objects.create(user=self.user, date=today, status='present')
        with self.assertRaises(Exception):
            AttendanceRecord.objects.create(user=self.user, date=today, status='late')
