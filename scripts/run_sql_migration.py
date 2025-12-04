import os
import sys
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set.")
    sys.exit(1)

def run_sql(file_path):
    print(f"Running SQL from {file_path}...")
    try:
        with open(file_path, 'r') as f:
            sql = f.read()
        
        # Supabase-py doesn't have a direct 'query' or 'execute_sql' method exposed easily 
        # for raw DDL unless we use the REST API 'rpc' or a specific postgres driver.
        # However, for DDL, we might need to use the SQL Editor in the dashboard OR 
        # if we have a postgres connection string.
        
        # BUT, since we are in a constrained environment, let's try to use the `rpc` 
        # if there is a helper function, OR just print instructions if we can't.
        
        # Actually, the user might have `psycopg2` or similar?
        # Let's try to use the `postgres` library if available, or just use the `supabase` client 
        # if there is a way. 
        
        # Wait, the previous `test_system_integration.py` used `supabase.rpc`.
        # Standard supabase-js/py doesn't allow raw SQL execution for security unless enabled.
        
        # Let's try to use a direct postgres connection if `psycopg2` is installed.
        # If not, I'll have to ask the user to run it or use a pre-existing RPC if one exists for running SQL (unlikely).
        
        # ALTERNATIVE: Use the `postgres` connection string if available in .env?
        # Let's check .env content (via `os.environ` check, I can't read the file directly securely/easily if I don't know the path, but I can assume it's loaded).
        
        # Let's try `psycopg2` first.
        import psycopg2
        
        # We need the connection string. Usually it's DB_URL or DATABASE_URL.
        db_url = os.environ.get("DATABASE_URL")
        if not db_url:
            print("Error: DATABASE_URL not found.")
            print("Please set DATABASE_URL in your .env file or run the SQL manually in your Supabase SQL Editor.")
            return

        conn = psycopg2.connect(db_url)
        conn.set_session(autocommit=True)
        try:
            with conn.cursor() as cur:
                cur.execute(sql)
        finally:
            conn.close()
        print("Success!")
    except ImportError:
        print("psycopg2 not installed. Please run the SQL manually.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run_sql_migration.py <sql_file>")
    else:
        run_sql(sys.argv[1])
