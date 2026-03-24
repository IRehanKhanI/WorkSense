import os
import sys

sys.path.append(r"c:\Users\User\Desktop\learning\WorkSense\BackendWoekSense")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "BackendWoekSense.settings")

import django
django.setup()

from rest_framework.test import APIClient

client = APIClient()

# Test Login without phone_device_id
print("Testing Login Endpoint with only username and password...")
response = client.post('/api/auth/login/', {'username': 'admin', 'password': 'admin123'}, format='json')

print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    print("SUCCESS! Data:")
    print(response.json())
else:
    print("FAILED! Errors:")
    print(response.json())
    sys.exit(1)
