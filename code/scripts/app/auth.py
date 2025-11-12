from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from typing import Optional

# Configuration
SECRET_KEY = "greek_military_secret_key_change_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# In-memory user store (replace with database in production)
users_db = {
    "admin": {
        "username": "admin",
        "hashed_password": pwd_context.hash("1234"),
        "full_name": "Διαχειριστής Συστήματος",
        "role": "admin"
    }
}

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None

class User(BaseModel):
    username: str
    full_name: Optional[str] = None
    role: str = "operator"

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user(username: str):
    if username in users_db:
        user_dict = users_db[username]
        return user_dict
    return None

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Μη εγκεκριμένα διαπιστευτήρια",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = get_user(username)
    if user is None:
        raise credentials_exception
    return user

@router.post("/signup", response_model=dict)
async def signup(user: UserCreate):
    if user.username in users_db:
        raise HTTPException(
            status_code=400,
            detail="Το όνομα χρήστη υπάρχει ήδη"
        )
    
    users_db[user.username] = {
        "username": user.username,
        "hashed_password": get_password_hash(user.password),
        "full_name": user.full_name or user.username,
        "role": "operator"
    }
    
    return {"status": "success", "message": "Ο λογαριασμός δημιουργήθηκε επιτυχώς"}

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=401,
            detail="Λανθασμένα στοιχεία σύνδεσης",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "username": user["username"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
    }

@router.get("/me", response_model=User)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return User(
        username=current_user["username"],
        full_name=current_user["full_name"],
        role=current_user["role"]
    )

@router.post("/logout")
async def logout():
    return {"status": "success", "message": "Αποσυνδεθήκατε επιτυχώς"}
