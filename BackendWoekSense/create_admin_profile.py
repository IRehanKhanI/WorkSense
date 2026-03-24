import os
import sys

sys.path.append(r"c:\Users\User\Desktop\learning\WorkSense\BackendWoekSense")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "BackendWoekSense.settings")

import django
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()
from accounts.models import UserProfile

usr = User.objects.filter(username='admin').first()
if usr:
    profile, created = UserProfile.objects.get_or_create(user=usr, defaults={'role': 'ADMIN', 'phone_device_id': 'admin_device'})
    print("Admin profile created/verified.")
else:
    print("Admin user not found.")
