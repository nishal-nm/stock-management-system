from rest_framework import serializers
from django.db import transaction
from versatileimagefield.serializers import VersatileImageFieldSerializer
from .models import Category, Products, ProductVariant, VariantOption, SubVariant, StockTransaction
from .utils import generate_sub_variants_for_product

class CategorySerializer(serializers.ModelSerializer):
    products_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'products_count']

    def get_products_count(self, obj):
        return obj.products.filter(Active=True).count()

class VariantOptionSerializer(serializers.ModelSerializer):
    variant_name = serializers.CharField(source='variant.name', read_only=True)

    class Meta:
        model = VariantOption
        fields = ['id', 'variant_name', 'value']

class ProductVariantSerializer(serializers.ModelSerializer):
    options = VariantOptionSerializer(many=True, required=False)

    class Meta:
        model = ProductVariant
        fields = ['id', 'product', 'name', 'options']
        read_only_fields = ('product',)

    @transaction.atomic
    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        variant = ProductVariant.objects.create(**validated_data)
        for option_data in options_data:
            VariantOption.objects.create(variant=variant, **option_data)
        
        generate_sub_variants_for_product(variant.product)
        return variant

    @transaction.atomic
    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', None)
        instance.name = validated_data.get('name', instance.name)
        instance.save()

        if options_data is not None:
            # Simple replace strategy: remove old and add new
            instance.options.all().delete()
            for option_data in options_data:
                VariantOption.objects.create(variant=instance, **option_data)
        
        generate_sub_variants_for_product(instance.product)
        return instance

class ProductWriteSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, required=False, write_only=True)
    
    class Meta:
        model = Products
        fields = '__all__'
        read_only_fields = (
            "ProductID",
            "TotalStock",
            "CreatedUser",
        )

    def to_internal_value(self, data):
        import json
        data_copy = data.copy() if hasattr(data, 'copy') else dict(data)
        
        # Support both 'name' (from doc spec) and 'ProductName'
        if 'name' in data_copy:
            data_copy['ProductName'] = data_copy.pop('name')
            
        # Parse variants JSON string if submitted via multipart/form-data
        if 'variants' in data_copy and isinstance(data_copy['variants'], str):
            try:
                data_copy['variants'] = json.loads(data_copy['variants'])
            except json.JSONDecodeError:
                pass
                
        # Translate simple string options array ["S", "M"] to [{"value": "S"}, ...]
        if 'variants' in data_copy and isinstance(data_copy['variants'], list):
            adapted_variants = []
            for var in data_copy['variants']:
                if isinstance(var, dict):
                    var_copy = var.copy()
                    if 'options' in var_copy and isinstance(var_copy['options'], list):
                        opts = var_copy['options']
                        if all(isinstance(o, str) for o in opts):
                            var_copy['options'] = [{'value': o} for o in opts]
                    adapted_variants.append(var_copy)
                else:
                    adapted_variants.append(var)
            data_copy['variants'] = adapted_variants
            
        return super().to_internal_value(data_copy)

    @transaction.atomic
    def create(self, validated_data):
        variants_data = validated_data.pop('variants', [])
        product = Products.objects.create(**validated_data)
        
        for variant_data in variants_data:
            options_data = variant_data.pop('options', [])
            variant = ProductVariant.objects.create(product=product, **variant_data)
            for option_data in options_data:
                VariantOption.objects.create(variant=variant, **option_data)
                
        if variants_data:
            generate_sub_variants_for_product(product)
            
        return product

    @transaction.atomic
    def update(self, instance, validated_data):
        variants_data = validated_data.pop('variants', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if variants_data is not None:
            instance.variants.all().delete()
            for variant_data in variants_data:
                options_data = variant_data.pop('options', [])
                variant = ProductVariant.objects.create(product=instance, **variant_data)
                for option_data in options_data:
                    VariantOption.objects.create(variant=variant, **option_data)
            
            generate_sub_variants_for_product(instance)
            
        return instance

class ProductReadSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(
        many=True,
        read_only=True
    )
    ProductImage = VersatileImageFieldSerializer(
        sizes=[
            ('full_size', 'url'),
            ('thumbnail', 'thumbnail__100x100'),
            ('medium', 'thumbnail__400x400'),
        ],
        required=False,
        allow_null=True
    )

    class Meta:
        model = Products
        fields = "__all__"

class SubVariantSerializer(serializers.ModelSerializer):
    options = VariantOptionSerializer(many=True, read_only=True)
    is_low_stock = serializers.SerializerMethodField()
    product_name = serializers.CharField(source='product.ProductName', read_only=True)
    product_code = serializers.CharField(source='product.ProductCode', read_only=True)

    class Meta:
        model = SubVariant
        fields = ['id', 'product', 'product_name', 'product_code', 'name', 'options', 'stock', 'low_stock_threshold', 'is_low_stock']
        read_only_fields = ('stock',)

    def get_is_low_stock(self, obj):
        return obj.stock <= obj.low_stock_threshold

class StockTransactionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='sub_variant.product.ProductName', read_only=True)
    sub_variant_name = serializers.SerializerMethodField()

    def get_sub_variant_name(self, obj):
        opts = obj.sub_variant.options.select_related('variant').all()
        return ' • '.join(f"{o.variant.name}: {o.value}" for o in opts) or obj.sub_variant.name

    class Meta:
        model = StockTransaction
        fields = '__all__'

    def validate(self, attrs):
        sub_variant = attrs.get('sub_variant')
        transaction_type = attrs.get('transaction_type')
        quantity = attrs.get('quantity')
        
        if transaction_type == 'OUT':
            if sub_variant.stock < quantity:
                raise serializers.ValidationError({"quantity": "Not enough stock available."})
        return attrs

class StockPurchaseSaleSerializer(serializers.ModelSerializer):
    sub_variant_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = StockTransaction
        fields = ('sub_variant_id', 'quantity', 'notes')

    def validate(self, attrs):
        try:
            sub_variant = SubVariant.objects.get(id=attrs['sub_variant_id'])
        except SubVariant.DoesNotExist:
            raise serializers.ValidationError({"sub_variant_id": "Invalid sub variant ID."})
        
        attrs['sub_variant'] = sub_variant
        
        if not sub_variant.product.Active:
            raise serializers.ValidationError({"non_field_errors": "Cannot modify stock for inactive products."})
        if sub_variant.product.is_deleted:
            raise serializers.ValidationError({"non_field_errors": "Cannot modify stock for deleted products."})
        
        transaction_type = self.context.get('transaction_type')
        if transaction_type == 'OUT':
            if sub_variant.stock < attrs.get('quantity'):
                raise serializers.ValidationError({"quantity": "Not enough stock available."})
                
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("sub_variant_id")

        sub_variant = validated_data["sub_variant"]
        transaction_type = self.context.get("transaction_type")
        quantity = validated_data["quantity"]
        
        if transaction_type == 'IN':
            new_balance = sub_variant.stock + quantity
        else:
            new_balance = sub_variant.stock - quantity

        transaction_obj = StockTransaction.objects.create(
            sub_variant=sub_variant,
            transaction_type=transaction_type,
            quantity=quantity,
            running_balance=new_balance,
            notes=validated_data.get("notes"),
        )

        return transaction_obj
