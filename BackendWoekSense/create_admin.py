import os
import sys

sys.path.append(r"c:\Users\User\Desktop\learning\WorkSense\BackendWoekSense")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "BackendWoekSense.settings")

import django
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

usr, created = User.objects.get_or_create(username='admin', defaults={'email': 'admin@example.com'})
usr.set_password('admin123')
usr.save()
print("Superuser ready.")
