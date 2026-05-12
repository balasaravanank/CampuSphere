import sqlite3

def add_term_column():
    conn = sqlite3.connect('d:/DEV/CampusCrew/backend/campusphere_test.db')
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE events ADD COLUMN term VARCHAR(100) NOT NULL DEFAULT 'General'")
        print("Successfully added 'term' column to 'events' table in campusphere_test.db.")
    except sqlite3.OperationalError as e:
        print(f"Error (column might already exist): {e}")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    add_term_column()
