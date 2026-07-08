from rest_framework import serializers
from django.db import transaction
from .models import Category, Products, ProductVariant, VariantOption, SubVariant, StockTransaction
from .utils import generate_sub_variants_for_product

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductsSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, required=False, write_only=True)
    
    class Meta:
        model = Products
        fields = '__all__'
        read_only_fields = ('TotalStock', 'CreatedUser')

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

class VariantOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VariantOption
        fields = ['id', 'value']

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

class SubVariantSerializer(serializers.ModelSerializer):
    options = VariantOptionSerializer(many=True, read_only=True)
    class Meta:
        model = SubVariant
        fields = '__all__'
        read_only_fields = ('stock',)

class StockTransactionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='sub_variant.product.ProductName', read_only=True)
    sub_variant_name = serializers.CharField(source='sub_variant.name', read_only=True)

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

    def create(self, validated_data):
        validated_data.pop('sub_variant_id')
        validated_data['transaction_type'] = self.context.get('transaction_type')
        return super().create(validated_data)
