import os
import sys

sys.path.append(r"c:\Users\User\Desktop\learning\WorkSense\BackendWoekSense")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "BackendWoekSense.settings")

import django
django.setup()

from rest_framework.test import APIClient

client = APIClient()

print("--- TESTING LOGIN ---")
response = client.post('/api/auth/login/', {'username': 'admin', 'password': 'admin123'}, format='json')
print(f"Login Status: {response.status_code}")
print(f"Login Response: {response.json()}")

print("\n--- TESTING REGISTER ---")
response2 = client.post('/api/auth/register/', {'username': 'newuser1', 'password': 'newpassword123', 'email': 'new@user.com'}, format='json')
print(f"Register Status: {response2.status_code}")
print(f"Register Response: {response2.json()}")
