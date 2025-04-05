from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

passwords = ["pw5", "pw6", "pw7", "pw8"]

for pw in passwords:
    print(f"{pw}: {pwd_context.hash(pw)}")



# Often used commands: 
# venv\Scripts\activate
# uvicorn app:app --reload
# npm start
