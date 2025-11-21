from tortoise.models import Model
from tortoise import fields
import uuid

class Scenario(Model):
    id = fields.UUIDField(pk=True, default=uuid.uuid4)
    name = fields.CharField(max_length=255)
    description = fields.TextField(null=True)
    funding = fields.DecimalField(max_digits=15, decimal_places=2, null=True)
    revenue = fields.DecimalField(max_digits=15, decimal_places=2, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "scenarios"
