"""Quick test: verify all 3 seed users can log in."""
import httpx

BASE = "http://localhost:8002/api/v1"

USERS = [
    ("admin@campusphere.com", "Admin@2026!"),
    ("staff@saveetha.ac.in", "Staff@2026!"),
    ("student@saveetha.ac.in", "Student@2026!"),
]

for email, pwd in USERS:
    r = httpx.post(f"{BASE}/auth/login", json={"email": email, "password": pwd})
    if r.status_code == 200:
        user = r.json()["data"]["user"]
        token = r.json()["data"]["access_token"][:20] + "..."
        print(f"[OK] {user['role']:8s} | {user['email']:28s} | token={token}")
        
        # Test /auth/me with the token
        me = httpx.get(f"{BASE}/auth/me", headers={"Authorization": f"Bearer {r.json()['data']['access_token']}"})
        assert me.status_code == 200, f"/me failed for {email}"
    else:
        print(f"[FAIL] {email} -> {r.status_code}: {r.text[:100]}")

print()

# Test CORS preflight
cors_r = httpx.options(
    f"{BASE}/auth/login",
    headers={
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type,authorization",
    },
)
cors_headers = dict(cors_r.headers)
origin = cors_headers.get("access-control-allow-origin", "MISSING")
print(f"CORS preflight: {cors_r.status_code} | allow-origin={origin}")

if origin == "http://localhost:5173":
    print("[OK] CORS is configured correctly")
else:
    print("[FAIL] CORS origin mismatch!")
