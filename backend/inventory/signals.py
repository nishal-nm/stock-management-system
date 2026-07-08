from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
from .models import StockTransaction, SubVariant, Products

@receiver(post_save, sender=StockTransaction)
@receiver(post_delete, sender=StockTransaction)
def update_stock(sender, instance, **kwargs):
    sub_variant = instance.sub_variant
    # Calculate stock for sub_variant
    stock_in = StockTransaction.objects.filter(
        sub_variant=sub_variant, transaction_type='IN'
    ).aggregate(total=Sum('quantity'))['total'] or 0
    stock_out = StockTransaction.objects.filter(
        sub_variant=sub_variant, transaction_type='OUT'
    ).aggregate(total=Sum('quantity'))['total'] or 0
    
    sub_variant.stock = stock_in - stock_out
    sub_variant.save()

@receiver(post_save, sender=SubVariant)
@receiver(post_delete, sender=SubVariant)
def update_product_total_stock(sender, instance, **kwargs):
    product = instance.product
    total_stock = SubVariant.objects.filter(product=product).aggregate(total=Sum('stock'))['total'] or 0
    product.TotalStock = total_stock
    product.save(update_fields=['TotalStock'])
