from typing import Optional
from uuid import UUID
from tortoise.exceptions import DoesNotExist
from app.models.user import User

class UserRepository:
    """Simple repository for User model operations"""

    # Create user
    @staticmethod
    async def create_user(
        google_id: str,
        email: str,
        name: str,
        profile_picture: str = None
    ) -> User:
        """Create a new user"""
        user = await User.create(
            google_id=google_id,
            email=email,
            name=name,
            profile_picture=profile_picture
        )
        return user

    @staticmethod
    async def get_user_by_id(user_id: str|UUID) -> Optional[User]:
        """Get user by ID"""
        try:
            return await User.get(id=user_id)
        except (DoesNotExist,ValueError):
            return None