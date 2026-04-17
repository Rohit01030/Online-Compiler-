import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def save_code(user_id, code, language, output):
    """Save code execution to database"""
    try:
        supabase.table("code_history").insert({
            "user_id": user_id,
            "code": code,
            "language": language,
            "output": output
        }).execute()
    except Exception as e:
        print(f"Error saving code: {e}")

def get_history(user_id):
    """Retrieve user's code history"""
    try:
        response = supabase.table("code_history").select("*").eq("user_id", user_id).order("id", desc=True).limit(50).execute()
        return response.data
    except Exception as e:
        print(f"Error getting history: {e}")
        return []