"""External opportunity scrapers — Unstop & Devfolio.

Each scraper fetches public listings, normalizes them into a common dict format,
and upserts into the database using source + source_id for deduplication.
Failures are logged but never crash the server.
"""

import logging
from datetime import datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory
from app.models.opportunity import Opportunity, OpportunityType

logger = logging.getLogger("scraper")

UNSTOP_API = "https://unstop.com/api/public/opportunity/search-new"
DEVFOLIO_API = "https://api.devfolio.co/api/search/hackathons"


def _parse_iso(date_str: str | None) -> datetime | None:
    """Safely parse an ISO date string to datetime."""
    if not date_str:
        return None
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        return None


def _parse_unix(ts: int | float | None) -> datetime | None:
    """Convert a unix timestamp (seconds) to tz-aware datetime."""
    if not ts:
        return None
    try:
        return datetime.fromtimestamp(float(ts), tz=timezone.utc)
    except (ValueError, TypeError, OSError):
        return None


async def scrape_unstop() -> list[dict]:
    """Fetch hackathons & competitions from Unstop public listings."""
    items: list[dict] = []
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            for opp_type in ["hackathons", "competitions", "internships"]:
                resp = await client.get(
                    UNSTOP_API,
                    params={"opportunity": opp_type, "per_page": 20, "page": 1},
                    headers={"Accept": "application/json"},
                )
                if resp.status_code != 200:
                    logger.warning("Unstop %s returned %s", opp_type, resp.status_code)
                    continue

                data = resp.json()
                opportunities = data.get("data", {}).get("data", [])
                if not isinstance(opportunities, list):
                    continue

                for opp in opportunities:
                    mapped_type = {
                        "hackathons": "hackathon",
                        "competitions": "competition",
                        "internships": "internship",
                    }.get(opp_type, "hackathon")

                    items.append({
                        "source": "unstop",
                        "source_id": str(opp.get("id", "")),
                        "type": mapped_type,
                        "title": opp.get("title", "Untitled"),
                        "organization": opp.get("organisation", {}).get("name", "Unstop")
                                        if isinstance(opp.get("organisation"), dict)
                                        else opp.get("organisation_name", "Unstop"),
                        "description": opp.get("seo_details", {}).get("seo_description")
                                       if isinstance(opp.get("seo_details"), dict)
                                       else None,
                        "link": f"https://unstop.com/{opp.get('public_url', '')}",
                        "deadline": _parse_iso(opp.get("regnRequirements", {}).get("end_regn_dt"))
                                    if isinstance(opp.get("regnRequirements"), dict)
                                    else _parse_iso(opp.get("end_date")),
                        "logo_url": opp.get("logoUrl2") or opp.get("logoUrl") or opp.get("banner_mobile"),
                    })
        logger.info("Unstop: fetched %d items", len(items))
    except Exception:
        logger.exception("Unstop scraper failed")
    return items


async def scrape_devfolio() -> list[dict]:
    """Fetch hackathons from Devfolio's public API."""
    items: list[dict] = []
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            payload = {
                "type": "application_open",
                "from": 0,
                "size": 20,
            }
            resp = await client.post(
                DEVFOLIO_API,
                json=payload,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
            )
            if resp.status_code != 200:
                logger.warning("Devfolio returned %s", resp.status_code)
                return items

            data = resp.json()
            hackathons = data.get("hits", {}).get("hits", [])
            if not isinstance(hackathons, list):
                return items

            for hit in hackathons:
                h = hit.get("_source", {}) if isinstance(hit, dict) else {}
                if not h:
                    continue
                items.append({
                    "source": "devfolio",
                    "source_id": h.get("uuid", str(h.get("slug", ""))),
                    "type": "hackathon",
                    "title": h.get("name", "Untitled"),
                    "organization": h.get("organisation_name", "Devfolio"),
                    "description": h.get("desc", None),
                    "link": f"https://devfolio.co/hackathons/{h.get('slug', '')}",
                    "deadline": _parse_unix(h.get("ends_at")) or _parse_iso(h.get("hackathon_setting", {}).get("reg_ends_at")),
                    "logo_url": h.get("logo"),
                })
        logger.info("Devfolio: fetched %d items", len(items))
    except Exception:
        logger.exception("Devfolio scraper failed")
    return items


async def sync_external_opportunities() -> dict[str, int]:
    """Run all scrapers and upsert results into the database. Returns counts."""
    all_items: list[dict] = []

    unstop_items = await scrape_unstop()
    devfolio_items = await scrape_devfolio()
    all_items.extend(unstop_items)
    all_items.extend(devfolio_items)

    if not all_items:
        logger.info("No external opportunities fetched — skipping sync")
        return {"inserted": 0, "skipped": 0}

    inserted = 0
    skipped = 0

    async with async_session_factory() as db:
        for item in all_items:
            source = item["source"]
            source_id = item["source_id"]

            if not source_id:
                skipped += 1
                continue

            # Dedup check
            existing = await db.execute(
                select(Opportunity).where(
                    Opportunity.source == source,
                    Opportunity.source_id == source_id,
                )
            )
            if existing.scalar_one_or_none():
                skipped += 1
                continue

            # Validate type
            try:
                opp_type = OpportunityType(item["type"])
            except ValueError:
                opp_type = OpportunityType.HACKATHON

            opp = Opportunity(
                type=opp_type,
                title=item["title"][:300],
                organization=item["organization"][:200],
                description=item.get("description"),
                link=item.get("link"),
                deadline=item.get("deadline"),
                source=source,
                source_id=source_id,
                logo_url=item.get("logo_url"),
            )
            db.add(opp)
            inserted += 1

        await db.commit()

    logger.info("Sync complete — inserted=%d, skipped=%d", inserted, skipped)
    return {"inserted": inserted, "skipped": skipped}
