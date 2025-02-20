from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

passwords = ["pw1", "pw2", "pw3", "pw4"]

for pw in passwords:
    print(f"{pw}: {pwd_context.hash(pw)}")
