import os
from dotenv import load_dotenv

load_dotenv()

# Get database connection URL (requires service_role key for DDL)
# Format: postgresql://postgres:[password]@[host]:[port]/[database]
db_url = os.environ.get("DATABASE_URL")

if not db_url:
    print("WARNING: DATABASE_URL environment variable not set.")
    print("DDL operations require direct PostgreSQL access with service_role privileges.")
    print("\nSet DATABASE_URL in your .env file:")
    print("DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres")
    print("\nFor now, please run this SQL manually in the Supabase SQL Editor:\n")

sql = """
create table if not exists public.transactions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade,
    amount int not null, -- Amount in smallest currency unit (e.g., paise)
    currency text default 'INR',
    credits_amount int not null, -- How many credits this buys
    razorpay_order_id text unique,
    razorpay_payment_id text,
    status text default 'pending', -- pending, success, failed
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.transactions enable row level security;

drop policy if exists "Users can view their own transactions" on public.transactions;
create policy "Users can view their own transactions" on public.transactions for select using (auth.uid() = user_id);
"""

# Attempt to execute SQL if we have psycopg2 and DATABASE_URL
if db_url:
    try:
        import psycopg2
        
        print("Connecting to database...")
        conn = psycopg2.connect(db_url)
        try:
            cursor = conn.cursor()
            try:
                print("Executing SQL...")
                # Split SQL into separate statements for reliability
                statements = sql.split(';')
                for statement in statements:
                    if statement.strip():
                        cursor.execute(statement)
                conn.commit()
                print("✅ SUCCESS: Transactions table created successfully!")
            finally:
                cursor.close()
        finally:
            conn.close()
        
    except ImportError:
        print("❌ ERROR: psycopg2 not installed. Install with: pip install psycopg2-binary")
        print("\nSQL to run manually:")
        print(sql)
    except Exception as e:
        print(f"❌ ERROR executing SQL: {e}")
        print("\nSQL to run manually:")
        print(sql)
else:
    # No DATABASE_URL, just print the SQL
    print(sql)
