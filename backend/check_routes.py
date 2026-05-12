"""Quick test — check if the create_event route is properly registered."""
import sys
sys.path.insert(0, ".")

from app.main import app

for route in app.routes:
    if hasattr(route, 'methods') and 'events' in getattr(route, 'path', ''):
        print(f"  {route.methods} {route.path}")
