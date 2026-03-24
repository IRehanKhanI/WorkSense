import os
import sys

# Ensure the project root is in the python path
sys.path.append(r"c:\Users\User\Desktop\learning\WorkSense\BackendWoekSense")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "BackendWoekSense.settings")

import django
django.setup()

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

# Check if tables exist by querying
try:
    print(f"Users found: {User.objects.count()}")
    print(f"Tokens found: {Token.objects.count()}")
    print("SUCCESS: Tables exist.")
    
    # Try login simulation
    admin = User.objects.filter(username="admin").first()
    if admin:
        print(f"Admin exists.")
        token, _ = Token.objects.get_or_create(user=admin)
        print(f"Token for admin: {token.key}")
        
        from accounts.models import UserProfile
        profile, created = UserProfile.objects.get_or_create(
            user=admin,
            defaults={
                'phone_device_id': 'test_device',
                'role': 'ADMIN',
                'is_device_registered': True
            }
        )
        print("Admin profile ready.")
        
    else:
        print("Admin user not found, creating it now...")
        admin = User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        from accounts.models import UserProfile
        UserProfile.objects.create(
             user=admin,
             phone_device_id='test_device',
             role='ADMIN',
             is_device_registered=True
        )
        print("Admin user created successfully.")

except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
