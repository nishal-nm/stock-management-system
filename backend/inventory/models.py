import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from versatileimagefield.fields import VersatileImageField

class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Products(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ProductID = models.BigIntegerField(unique=True)
    ProductCode = models.CharField(max_length=255, unique=True)
    ProductName = models.CharField(max_length=255)
    ProductImage = VersatileImageField(upload_to='uploads/', blank=True, null=True)
    CreatedDate = models.DateTimeField(auto_now_add=True)
    UpdatedDate = models.DateTimeField(blank=True, null=True)
    CreatedUser = models.ForeignKey('auth.User', related_name='user%(class)s_objects', on_delete=models.CASCADE)
    IsFavourite = models.BooleanField(default=False)
    Active = models.BooleanField(default=True)
    HSNCode = models.CharField(max_length=255, blank=True, null=True)
    TotalStock = models.DecimalField(default=0.00, max_digits=20, decimal_places=8, blank=True, null=True)
    Category = models.ForeignKey(Category, on_delete=models.SET_NULL, blank=True, null=True, related_name='products')
    
    class Meta:
        db_table = 'products_product'
        verbose_name = _('product')
        verbose_name_plural = _('products')
        unique_together = (('ProductCode', 'ProductID'),)
        ordering = ('-CreatedDate', 'ProductID')

    def __str__(self):
        return self.ProductName

class ProductVariant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Products, related_name='variants', on_delete=models.CASCADE)
    name = models.CharField(max_length=255) # e.g., Size, Color

    class Meta:
        unique_together = (('product', 'name'),)

    def __str__(self):
        return f"{self.product.ProductName} - {self.name}"

class VariantOption(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    variant = models.ForeignKey(ProductVariant, related_name='options', on_delete=models.CASCADE)
    value = models.CharField(max_length=255) # e.g., S, M, L, Red, Blue

    class Meta:
        unique_together = (('variant', 'value'),)

    def __str__(self):
        return f"{self.variant.name}: {self.value}"

class SubVariant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Products, related_name='sub_variants', on_delete=models.CASCADE)
    name = models.CharField(max_length=500) # e.g., Size: S, Color: Red
    options = models.ManyToManyField(VariantOption, related_name='sub_variants')
    stock = models.DecimalField(default=0.00, max_digits=20, decimal_places=8)
    low_stock_threshold = models.DecimalField(default=10.00, max_digits=20, decimal_places=8)

    def __str__(self):
        return f"{self.product.ProductName} - {self.name}"

    class Meta:
        unique_together = (('product', 'name'),)
        constraints = [
            models.CheckConstraint(condition=models.Q(stock__gte=0), name='stock_guard_positive')
        ]

class StockTransaction(models.Model):
    TRANSACTION_TYPES = (
        ('IN', 'Stock In (Purchase)'),
        ('OUT', 'Stock Out (Sale)'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sub_variant = models.ForeignKey(SubVariant, related_name='transactions', on_delete=models.CASCADE)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    quantity = models.DecimalField(max_digits=20, decimal_places=8)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.transaction_type} - {self.sub_variant} ({self.quantity})"
