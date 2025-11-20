from tortoise.models import Model
from tortoise import fields
import uuid

class Cost(Model):
    id = fields.UUIDField(pk=True, default=uuid.uuid4)
    title = fields.CharField(max_length=255)
    value = fields.DecimalField(max_digits=15, decimal_places=2)  # annualValue
    category = fields.CharField(max_length=100)
    starts_at = fields.IntField()  # month number
    end_at = fields.IntField(null=True)  # month number, nullable
    freq = fields.CharField(max_length=20)  # frequency enum
    scenario = fields.ForeignKeyField(
        "models.Scenario",
        related_name="costs",
        on_delete=fields.CASCADE
    )
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "costs"
