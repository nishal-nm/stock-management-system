from django.contrib import admin
from .models import Category, Products, ProductVariant, VariantOption, SubVariant, StockTransaction

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

@admin.register(Products)
class ProductsAdmin(admin.ModelAdmin):
    list_display = ('ProductID', 'ProductCode', 'ProductName', 'TotalStock', 'Active', 'CreatedDate')
    search_fields = ('ProductCode', 'ProductName')
    list_filter = ('Active', 'IsFavourite', 'CreatedDate')
    readonly_fields = ('TotalStock',)

@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'name')
    search_fields = ('name', 'product__ProductName')
    list_filter = ('product',)

@admin.register(VariantOption)
class VariantOptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'variant', 'value')
    search_fields = ('value', 'variant__name', 'variant__product__ProductName')
    list_filter = ('variant',)

@admin.register(SubVariant)
class SubVariantAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'name', 'stock', 'low_stock_threshold')
    search_fields = ('name', 'product__ProductName')
    list_filter = ('product',)
    readonly_fields = ('stock',)

@admin.register(StockTransaction)
class StockTransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'sub_variant', 'transaction_type', 'quantity', 'created_at')
    search_fields = ('sub_variant__name', 'sub_variant__product__ProductName', 'notes')
    list_filter = ('transaction_type', 'created_at')
