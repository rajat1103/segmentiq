from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from app.models.customer import Customer
from app.schemas.customer import (
    CustomerCreate,
    CustomerResponse,
    CustomerUpdate
)

from app.core.database import get_db

router = APIRouter()


# ─────────────────────────────────────────────────────────
# IMPORTANT: /stats/overview MUST come BEFORE /{customer_id}
# to avoid FastAPI treating "stats" as a customer_id parameter.
# ─────────────────────────────────────────────────────────

@router.get("/stats/overview")
def customer_stats(db: Session = Depends(get_db)):
    total_customers = db.query(Customer).count()
    total_revenue = db.query(func.sum(Customer.total_spent)).scalar() or 0.0
    average_spent = round(total_revenue / total_customers, 2) if total_customers > 0 else 0.0

    return {
        "total_customers": total_customers,
        "total_revenue": round(total_revenue, 2),
        "average_spent": average_spent,
    }


@router.get(
    "/",
    response_model=list[CustomerResponse]
)
def get_customers(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    city: Optional[str] = None,
    gender: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Customer)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Customer.name.ilike(search_term)) |
            (Customer.email.ilike(search_term)) |
            (Customer.phone.ilike(search_term))
        )
    if city:
        query = query.filter(Customer.city == city)
    if gender:
        query = query.filter(Customer.gender == gender)

    return query.order_by(Customer.id.desc()).offset(skip).limit(limit).all()


@router.post(
    "/",
    response_model=CustomerResponse,
    status_code=201
)
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db)
):
    # Check duplicate email
    existing = db.query(Customer).filter(Customer.email == customer.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_customer = Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone,
        city=customer.city,
        gender=customer.gender,
        age=customer.age
    )

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)

    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db.delete(customer)
    db.commit()
    return {"message": "Customer deleted successfully"}