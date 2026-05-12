import bcrypt
import jwt
import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'my_super_secret_key')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def get_password_hash(password: str) -> str:
    # Generar el salt y el hash
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Verificar la contraseña
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)





# Depricated

# from datetime import datetime, timedelta, timezone
# import jwt
# from passlib.context import CryptContext
# import os
# from dotenv import load_dotenv
#
# load_dotenv()
#
# # Configuration for JWT
# # In production, SECRET_KEY should be a long random string .env file
# SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'my_super_secret_key')
# ALGORITHMS = 'HS256'
# ACCESS_TOKEN_EXPIRE_MINUTES = 30
#
# # Setup for bcrypt password hashing
# pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
#
# def verify_password(plain_password: str, hashed_password: str) -> bool:
#     """Checks if the password matches the hashed password."""
#     return pwd_context.verify(plain_password, hashed_password)
#
# def get_password_hash(password: str) -> str:
#     """Hashes the password and returns the hashed password."""
#     return pwd_context.hash(password)
#
# def create_access_token(data: dict) -> str:
#     """Generates a new JWT token with expiration time"""
#     to_encode = data.copy()
#
#     # Set the expiration time
#     expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     to_encode.update({"exp": expire})
#
#     # Encode the JWT
#     encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHMS)
#
