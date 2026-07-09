from rest_framework import serializers
from django.db import transaction
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

class ProductReadSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Products
        fields = "__all__"

class SubVariantSerializer(serializers.ModelSerializer):
    options = VariantOptionSerializer(many=True, read_only=True)
    class Meta:
        model = SubVariant
        fields = '__all__'
        read_only_fields = ('stock',)

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
        
        transaction_type = self.context.get('transaction_type')
        if transaction_type == 'OUT':
            if sub_variant.stock < attrs.get('quantity'):
                raise serializers.ValidationError({"quantity": "Not enough stock available."})
                
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("sub_variant_id")

        transaction_obj = StockTransaction.objects.create(
            sub_variant=validated_data["sub_variant"],
            transaction_type=self.context.get("transaction_type"),
            quantity=validated_data["quantity"],
            notes=validated_data.get("notes"),
        )

        return transaction_obj
