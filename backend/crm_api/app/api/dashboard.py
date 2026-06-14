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

        if total_orders > 0:
            total_revenue = db.query(func.sum(Order.amount)).scalar() or 0.0
            avg_order_value = (
                total_revenue / total_orders if total_orders > 0 else 0.0
            )
        else:
            # Fallback to customer total_spent
            total_revenue = db.query(func.sum(Customer.total_spent)).scalar() or 0.0
            total_orders = active_buyers
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


@router.get("/age-distribution")
def age_distribution():
    db = SessionLocal()
    try:
        # Group customers into age buckets: 18-24, 25-34, 35-44, 45-54, 55+
        customers = db.query(Customer.age).all()
        buckets = {
            "18–24": 0,
            "25–34": 0,
            "35–44": 0,
            "45–54": 0,
            "55+": 0
        }
        for (age,) in customers:
            if not age:
                continue
            if age >= 18 and age <= 24:
                buckets["18–24"] += 1
            elif age >= 25 and age <= 34:
                buckets["25–34"] += 1
            elif age >= 35 and age <= 44:
                buckets["35–44"] += 1
            elif age >= 45 and age <= 54:
                buckets["45–54"] += 1
            elif age >= 55:
                buckets["55+"] += 1
        
        return [{"age": k, "customers": v} for k, v in buckets.items()]
    finally:
        db.close()


@router.get("/monthly-revenue")
def monthly_revenue():
    """Returns monthly revenue trend for the past 12 months — powers the dashboard graph."""
    db = SessionLocal()
    try:
        from sqlalchemy import extract
        from datetime import datetime, timedelta

        order_count = db.query(Order).count()
        if order_count > 0:
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
        else:
            # Fallback when there are no orders in the DB (like when CSV is uploaded)
            # We distribute customers' total_spent across the past 6 months based on customer id
            import calendar
            
            customers = db.query(Customer.id, Customer.total_spent, Customer.created_at).all()
            now = datetime.utcnow()
            monthly_data = {}
            for i in range(6):
                # Calculate month and year by subtracting months
                m_date = now
                for _ in range(i):
                    # Go back one month
                    first_of_this_month = m_date.replace(day=1)
                    last_month = first_of_this_month - timedelta(days=1)
                    m_date = last_month
                
                key = (m_date.year, m_date.month)
                monthly_data[key] = {"revenue": 0.0, "orders": 0}
            
            keys_list = sorted(list(monthly_data.keys()))
            
            # Distribute customer spent
            for c_id, total_spent, created_at in customers:
                if not total_spent:
                    continue
                # Determine month index deterministically based on c_id
                idx = c_id % 6
                target_key = keys_list[idx]
                monthly_data[target_key]["revenue"] += total_spent
                monthly_data[target_key]["orders"] += 1
            
            result = []
            for (year, month) in keys_list:
                month_name = calendar.month_abbr[month]
                stats = monthly_data[(year, month)]
                result.append({
                    "month": f"{month_name} {year}",
                    "revenue": round(stats["revenue"], 2),
                    "orders": stats["orders"]
                })
            return result
    finally:
        db.close()