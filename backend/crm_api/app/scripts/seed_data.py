from faker import Faker
from random import randint, uniform, choice
from datetime import datetime

from app.core.database import SessionLocal
from app.models.customer import Customer
from app.models.order import Order

fake = Faker()

db = SessionLocal()

print("Creating customers...")

customers = []

for _ in range(1000):

    customer = Customer(
        name=fake.name(),
        email=fake.unique.email(),
        phone=fake.unique.msisdn()[:10],
        city=choice([
            "Chennai",
            "Bangalore",
            "Mumbai",
            "Delhi",
            "Hyderabad",
            "Pune"
        ]),
        gender=choice([
            "Male",
            "Female"
        ]),
        age=randint(18, 65)
    )

    customers.append(customer)

db.add_all(customers)
db.commit()

print("Customers created!")

all_customers = db.query(Customer).all()

print("Creating orders...")

orders = []

for _ in range(10000):

    customer = choice(all_customers)

    quantity = randint(1, 5)

    amount = round(
        uniform(500, 5000),
        2
    )

    order = Order(
        customer_id=customer.id,
        product_name=choice([
            "Laptop",
            "Phone",
            "Tablet",
            "Headphones",
            "Smart Watch",
            "Camera"
        ]),
        quantity=quantity,
        amount=amount,
        order_date=fake.date_time_between(
            start_date="-2y",
            end_date="now"
        )
    )

    customer.total_spent += amount

    orders.append(order)

db.add_all(orders)
db.commit()

print("Orders created!")

print("Done!")