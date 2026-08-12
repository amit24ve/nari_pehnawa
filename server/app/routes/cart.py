from datetime import datetime
from typing import Optional

from app.database import get_database
from app.security import get_current_user
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/cart", tags=["Cart"])


class AddToCartRequest(BaseModel):
    product_id: str
    name: str
    price: float
    image: Optional[str] = None
    size: str
    color: Optional[str] = None
    quantity: int = 1


class UpdateQuantityRequest(BaseModel):
    quantity: int


class MergeCartRequest(BaseModel):
    items: list[AddToCartRequest]


def _serialize_cart(cart: dict) -> dict:
    cart["_id"] = str(cart["_id"])
    return cart


@router.get("/")
def get_cart(current_user: dict = Depends(get_current_user)):
    """Get current user's cart"""
    db = get_database()
    user_id = current_user.get("id")
    cart = db["carts"].find_one({"user_id": user_id})
    if cart:
        return _serialize_cart(cart)
    return {"user_id": user_id, "items": [], "total": 0.0}


@router.post("/merge")
def merge_cart(request: MergeCartRequest, current_user: dict = Depends(get_current_user)):
    """Merge guest cart items with authenticated user's cart"""
    db = get_database()
    user_id = current_user.get("id")
    carts = db["carts"]

    cart = carts.find_one({"user_id": user_id})
    user_items = cart.get("items", []) if cart else []

    for guest_item in request.items:
        new_item = {
            "product_id": guest_item.product_id,
            "name": guest_item.name,
            "price": guest_item.price,
            "image": guest_item.image or "",
            "size": guest_item.size,
            "color": guest_item.color or "",
            "quantity": max(1, guest_item.quantity),
            "added_at": datetime.now().isoformat()
        }

        found = False
        for i, existing in enumerate(user_items):
            if (
                existing.get("product_id") == new_item["product_id"]
                and existing.get("size") == new_item["size"]
            ):
                user_items[i]["quantity"] = existing["quantity"] + new_item["quantity"]
                found = True
                break

        if not found:
            user_items.append(new_item)

    carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": user_items, "updated_at": datetime.now().isoformat()}},
        upsert=True
    )

    updated = carts.find_one({"user_id": user_id})
    return _serialize_cart(updated)


@router.post("/add")
def add_to_cart(item: AddToCartRequest, current_user: dict = Depends(get_current_user)):
    """Add item to cart or increase quantity if same product+size exists"""
    db = get_database()
    user_id = current_user.get("id")
    carts = db["carts"]

    new_item = {
        "product_id": item.product_id,
        "name": item.name,
        "price": item.price,
        "image": item.image or "",
        "size": item.size,
        "color": item.color or "",
        "quantity": max(1, item.quantity),
        "added_at": datetime.now().isoformat(),
    }

    cart = carts.find_one({"user_id": user_id})

    if not cart:
        cart_data = {
            "user_id": user_id,
            "items": [new_item],
            "updated_at": datetime.now().isoformat(),
        }
        result = carts.insert_one(cart_data)
        cart_data["_id"] = str(result.inserted_id)
        return cart_data

    # Cart exists — check if same product+size already in cart
    items = cart.get("items", [])
    found = False
    for i, existing in enumerate(items):
        if (
            existing.get("product_id") == item.product_id
            and existing.get("size") == item.size
        ):
            items[i]["quantity"] = existing["quantity"] + new_item["quantity"]
            found = True
            break

    if not found:
        items.append(new_item)

    carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": items, "updated_at": datetime.now().isoformat()}},
    )
    updated = carts.find_one({"user_id": user_id})
    return _serialize_cart(updated)


@router.put("/item/{product_id}")
def update_cart_item(
    product_id: str,
    size: str = Query(..., description="Product size"),
    body: UpdateQuantityRequest = ...,
    current_user: dict = Depends(get_current_user),
):
    """Update quantity of a specific cart item (product_id + size)"""
    db = get_database()
    user_id = current_user.get("id")
    carts = db["carts"]

    cart = carts.find_one({"user_id": user_id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    items = cart.get("items", [])
    found = False
    for i, item in enumerate(items):
        if item.get("product_id") == product_id and item.get("size") == size:
            if body.quantity <= 0:
                items.pop(i)
            else:
                items[i]["quantity"] = body.quantity
            found = True
            break

    if not found:
        raise HTTPException(status_code=404, detail="Item not found in cart")

    carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": items, "updated_at": datetime.now().isoformat()}},
    )
    updated = carts.find_one({"user_id": user_id})
    return _serialize_cart(updated)


@router.delete("/item/{product_id}")
def remove_cart_item(
    product_id: str,
    size: str = Query(..., description="Product size"),
    current_user: dict = Depends(get_current_user),
):
    """Remove a specific item from cart"""
    db = get_database()
    user_id = current_user.get("id")
    carts = db["carts"]

    cart = carts.find_one({"user_id": user_id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    items = cart.get("items", [])
    new_items = [
        it
        for it in items
        if not (it.get("product_id") == product_id and it.get("size") == size)
    ]

    carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": new_items, "updated_at": datetime.now().isoformat()}},
    )
    return {"message": "Item removed", "items_count": len(new_items)}


@router.delete("/clear")
def clear_cart(current_user: dict = Depends(get_current_user)):
    """Clear all items from cart"""
    db = get_database()
    user_id = current_user.get("id")
    db["carts"].update_one(
        {"user_id": user_id},
        {"$set": {"items": [], "updated_at": datetime.now().isoformat()}},
        upsert=True,
    )
    return {"message": "Cart cleared successfully"}
