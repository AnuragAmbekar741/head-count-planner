from tortoise.models import Model
from tortoise import fields
import uuid

class Revenue(Model):
    id = fields.UUIDField(pk=True, default=uuid.uuid4)
    title = fields.CharField(max_length=255)
    value = fields.DecimalField(max_digits=15, decimal_places=2)  # annualValue
    category = fields.CharField(max_length=100, null=True)  # Optional category
    starts_at = fields.IntField()  # month number
    end_at = fields.IntField(null=True)  # month number, nullable
    freq = fields.CharField(max_length=20)  # frequency enum
    is_active = fields.BooleanField(default=True)
    scenario = fields.ForeignKeyField(
        "models.Scenario",
        related_name="revenues",
        on_delete=fields.CASCADE
    )
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "revenues"
