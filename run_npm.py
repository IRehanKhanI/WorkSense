import os
import subprocess

p1 = r'C:\Users\User\Desktop\learning\WorkSense\WorkSense\package-lock.json'
if os.path.exists(p1):
    os.remove(p1)
    print("Deleted package-lock.json")

print("Running npm install...")
subprocess.run("npm install", shell=True, cwd=r"C:\Users\User\Desktop\learning\WorkSense\WorkSense")
print("NPM install finished!")
