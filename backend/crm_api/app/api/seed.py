"""
Seed API — provides a single POST /seed endpoint that populates the database
with realistic demo data for new users. Idempotent: won't seed if data exists.
"""
import random
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.customer import Customer
from app.models.order import Order
from app.models.campaign import Campaign
from app.models.communication_log import CommunicationLog

router = APIRouter(
    prefix="/seed",
    tags=["Seed"]
)

# ─── Demo data constants ────────────────────────────────────────────────────

INDIAN_NAMES = [
    ("Aarav Mehta", "Male"), ("Vivaan Sharma", "Male"), ("Aditya Patel", "Male"),
    ("Kabir Malhotra", "Male"), ("Arjun Sen", "Male"), ("Sai Krishnan", "Male"),
    ("Rohan Das", "Male"), ("Devendra Rao", "Male"), ("Rishabh Raj", "Male"),
    ("Rohit Joshi", "Male"), ("Ananya Nair", "Female"), ("Diya Iyer", "Female"),
    ("Kiara Deshmukh", "Female"), ("Myra Kulkarni", "Female"), ("Ishaan Gupta", "Male"),
    ("Dhruv Saxena", "Male"), ("Shreya Banerjee", "Female"), ("Riya Verma", "Female"),
    ("Aanya Reddy", "Female"), ("Tanisha Rao", "Female"),
]

CITIES = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune"]

PRODUCTS = ["Laptop", "Smartphone", "Tablet", "Headphones", "Smart Watch", "Camera", "Speaker"]

CAMPAIGNS_DATA = [
    {
        "name": "Mumbai Summer Blitz 2026",
        "segment_query": "total_spent > 10000",
        "message_template": "Exclusive summer deals for our premium customers in Mumbai!",
        "status": "COMPLETED",
    },
    {
        "name": "Bangalore VIP Loyalty Drive",
        "segment_query": "total_spent > 25000",
        "message_template": "As one of our top VIP customers, enjoy exclusive rewards just for you.",
        "status": "COMPLETED",
    },
    {
        "name": "Re-Engagement Wave — Inactive 90 Days",
        "segment_query": "total_spent < 500",
        "message_template": "We miss you! Here's 20% off your next purchase.",
        "status": "DRAFT",
    },
]


@router.post("")
def seed_database(db: Session = Depends(get_db)):
    """
    Seed the database with realistic demo data. Safe to call — will not
    duplicate data if customers already exist.
    """
    existing_count = db.query(Customer).count()
    if existing_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Database already contains {existing_count} customers. Use DELETE /seed/reset to clear first."
        )

    # ── Create 20 customers ─────────────────────────────────────────────────
    customers = []
    for i, (name, gender) in enumerate(INDIAN_NAMES):
        email_prefix = name.lower().replace(" ", ".").replace(".", "_", 1)
        customer = Customer(
            name=name,
            email=f"{email_prefix}@segmentiq.demo",
            phone=f"+9198{str(i).zfill(3)}{str(10000 + i * 137)[:5]}",
            city=CITIES[i % len(CITIES)],
            gender=gender,
            age=22 + (i % 38),
            total_spent=0.0,
        )
        db.add(customer)
        customers.append(customer)

    db.flush()  # Get IDs without committing

    # ── Create 2–8 orders per customer ─────────────────────────────────────
    all_orders = []
    for i, customer in enumerate(customers):
        num_orders = random.randint(2, 8)
        for j in range(num_orders):
            amount = round(random.uniform(1500, 25000), 2)
            days_ago = random.randint(1, 730)
            order = Order(
                customer_id=customer.id,
                product_name=random.choice(PRODUCTS),
                quantity=random.randint(1, 3),
                amount=amount,
                order_date=datetime.utcnow() - timedelta(days=days_ago),
            )
            customer.total_spent += amount
            db.add(order)
            all_orders.append(order)

    db.flush()

    # ── Create 3 sample campaigns ───────────────────────────────────────────
    campaign_objs = []
    for camp_data in CAMPAIGNS_DATA:
        campaign = Campaign(**camp_data)
        db.add(campaign)
        campaign_objs.append(campaign)

    db.flush()

    # ── Create communication logs for COMPLETED campaigns ───────────────────
    for campaign in campaign_objs:
        if campaign.status == "COMPLETED":
            for customer in customers:
                status = random.choices(["SENT", "FAILED"], weights=[88, 12])[0]
                log = CommunicationLog(
                    campaign_id=campaign.id,
                    customer_id=customer.id,
                    status=status,
                    sent_at=datetime.utcnow() - timedelta(hours=random.randint(1, 72)),
                )
                db.add(log)

    db.commit()

    # ── Return summary ──────────────────────────────────────────────────────
    total_revenue = sum(c.total_spent for c in customers)
    return {
        "message": "Database seeded successfully!",
        "customers_created": len(customers),
        "orders_created": len(all_orders),
        "campaigns_created": len(campaign_objs),
        "total_revenue": round(total_revenue, 2),
    }


@router.delete("/reset")
def reset_database(db: Session = Depends(get_db)):
    """
    Delete all data (communication logs, orders, campaigns, customers).
    USE WITH CAUTION — clears ALL data.
    """
    db.query(CommunicationLog).delete(synchronize_session=False)
    db.query(Order).delete(synchronize_session=False)
    db.query(Campaign).delete(synchronize_session=False)
    db.query(Customer).delete(synchronize_session=False)
    db.commit()
    return {"message": "All data cleared successfully."}
