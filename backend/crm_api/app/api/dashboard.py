from fastapi import APIRouter
from sqlalchemy import func

from app.core.database import SessionLocal
from app.models.customer import Customer
from app.models.order import Order

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/stats")
def get_dashboard_stats():
    db = SessionLocal()
    try:
        total_customers = db.query(Customer).count()
        total_orders = db.query(Order).count()

        # Guard against None when no orders exist
        total_revenue = db.query(func.sum(Order.amount)).scalar() or 0.0
        avg_order_value = (
            total_revenue / total_orders if total_orders > 0 else 0.0
        )

        return {
            "total_customers": total_customers,
            "total_orders": total_orders,
            "total_revenue": round(float(total_revenue), 2),
            "average_order_value": round(float(avg_order_value), 2),
        }
    finally:
        db.close()


@router.get("/city-distribution")
def city_distribution():
    db = SessionLocal()
    try:
        data = (
            db.query(Customer.city, func.count(Customer.id))
            .group_by(Customer.city)
            .all()
        )
        return [{"city": city, "customers": count} for city, count in data]
    finally:
        db.close()


@router.get("/revenue-by-city")
def revenue_by_city():
    db = SessionLocal()
    try:
        data = (
            db.query(Customer.city, func.sum(Customer.total_spent))
            .group_by(Customer.city)
            .all()
        )
        return [
            {"city": city, "revenue": round(float(revenue or 0), 2)}
            for city, revenue in data
        ]
    finally:
        db.close()


@router.get("/gender-distribution")
def gender_distribution():
    db = SessionLocal()
    try:
        data = (
            db.query(Customer.gender, func.count(Customer.id))
            .group_by(Customer.gender)
            .all()
        )
        return [{"gender": gender, "count": count} for gender, count in data]
    finally:
        db.close()