from abc import ABC, abstractmethod
from typing import Optional, Dict, Any

class AuthService(ABC):
    """
    Abstract base class for OAuth authentication services
    Defines the contract that all auth providers must implement
    """
    
    @abstractmethod
    async def verify_google_token(self, token: str) -> Optional[Dict[str, Any]]:
        pass