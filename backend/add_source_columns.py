"""One-time migration: add source, source_id, logo_url columns to opportunities table."""
import sqlite3
import sys

DB_PATH = "campusphere.db"
if len(sys.argv) > 1:
    DB_PATH = sys.argv[1]

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

columns_to_add = [
    ("source", "VARCHAR(50) DEFAULT 'manual' NOT NULL"),
    ("source_id", "VARCHAR(200)"),
    ("logo_url", "VARCHAR(500)"),
]

for col_name, col_def in columns_to_add:
    try:
        cursor.execute(f"ALTER TABLE opportunities ADD COLUMN {col_name} {col_def}")
        print(f"  [OK] Added column: {col_name}")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            print(f"  [SKIP] Column already exists: {col_name}")
        else:
            raise

cursor.execute("PRAGMA table_info(opportunities)")
cols = cursor.fetchall()
print(f"\nCurrent columns: {[c[1] for c in cols]}")

conn.commit()
conn.close()
print("\nMigration complete!")
