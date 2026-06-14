from fastapi import APIRouter
from sqlalchemy import func

from app.core.database import SessionLocal
from app.models.customer import Customer
from app.models.order import Order
from app.models.communication_log import CommunicationLog

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
        active_buyers = db.query(Customer).filter(Customer.total_spent > 0).count()

        # Guard against None when no orders exist
        total_revenue = db.query(func.sum(Order.amount)).scalar() or 0.0
        avg_order_value = (
            total_revenue / total_orders if total_orders > 0 else 0.0
        )

        # Communication delivery breakdown
        comm_rows = (
            db.query(CommunicationLog.status, func.count(CommunicationLog.id))
            .group_by(CommunicationLog.status)
            .all()
        )
        comm_stats = {status: count for status, count in comm_rows}
        total_comm = sum(comm_stats.values())

        return {
            "total_customers": total_customers,
            "total_orders": total_orders,
            "total_revenue": round(float(total_revenue), 2),
            "average_order_value": round(float(avg_order_value), 2),
            "active_buyers": active_buyers,
            # Communication breakdown (Phase 4 data)
            "comm_total":     total_comm,
            "comm_pending":   comm_stats.get("PENDING",   0),
            "comm_sent":      comm_stats.get("SENT",      0),
            "comm_delivered": comm_stats.get("DELIVERED", 0),
            "comm_clicked":   comm_stats.get("CLICKED",   0),
            "comm_failed":    comm_stats.get("FAILED",    0),
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


@router.get("/monthly-revenue")
def monthly_revenue():
    """Returns monthly revenue trend for the past 12 months — powers the dashboard graph."""
    db = SessionLocal()
    try:
        from sqlalchemy import extract
        from datetime import datetime, timedelta

        # Get revenue grouped by month for last 12 months
        data = (
            db.query(
                extract("year",  Order.order_date).label("year"),
                extract("month", Order.order_date).label("month"),
                func.sum(Order.amount).label("revenue"),
                func.count(Order.id).label("orders"),
            )
            .group_by("year", "month")
            .order_by("year", "month")
            .all()
        )

        import calendar
        result = []
        for row in data:
            month_name = calendar.month_abbr[int(row.month)]
            result.append({
                "month": f"{month_name} {int(row.year)}",
                "revenue": round(float(row.revenue or 0), 2),
                "orders": int(row.orders or 0),
            })
        return result
    finally:
        db.close()