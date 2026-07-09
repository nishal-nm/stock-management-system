from django.urls import path
from .views import (
    CategoryList, CategoryDetail,
    ProductList, ProductDetail, ProductDashboard,
    ProductVariantList, ProductVariantDetail,
    SubVariantList, SubVariantDetail,
    StockTransactionDetail, StockReport,
    StockPurchase, StockSale, SubVariantStockList
)

urlpatterns = [
    # Categories
    path('categories/', CategoryList.as_view(), name='category-list'),
    path('categories/<uuid:pk>/', CategoryDetail.as_view(), name='category-detail'),
    
    # Products
    path('products/', ProductList.as_view(), name='product-list'),
    path('products/dashboard/', ProductDashboard.as_view(), name='product-dashboard'),
    path('products/<uuid:pk>/', ProductDetail.as_view(), name='product-detail'),
    
    # Variants
    path('products/<uuid:product_id>/variants/', ProductVariantList.as_view(), name='product-variant-list'),
    path('variants/<uuid:pk>/', ProductVariantDetail.as_view(), name='variant-detail'),
    
    # SubVariants
    path('products/<uuid:product_id>/subvariants/', SubVariantList.as_view(), name='product-subvariant-list'),
    path('subvariants/<uuid:pk>/', SubVariantDetail.as_view(), name='subvariant-detail'),
    
    # Stock Transactions
    path('stock/', SubVariantStockList.as_view(), name='stock-list'),
    path('stock/report/', StockReport.as_view(), name='stock-report'),
    path('stock/purchase/', StockPurchase.as_view(), name='stock-purchase'),
    path('stock/sale/', StockSale.as_view(), name='stock-sale'),
    path('stock/<uuid:pk>/', StockTransactionDetail.as_view(), name='stock-detail'),
]
