from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from .models import Category, Products, ProductVariant, SubVariant, StockTransaction
from .serializers import (CategorySerializer, ProductsSerializer, ProductVariantSerializer,
                          SubVariantSerializer, StockTransactionSerializer, StockPurchaseSaleSerializer)

# --- Category Views ---
class CategoryList(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class CategoryDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


# --- Products Views ---
class ProductList(generics.ListCreateAPIView):
    queryset = Products.objects.all()
    serializer_class = ProductsSerializer

    def perform_create(self, serializer):
        serializer.save(CreatedUser=self.request.user)

class ProductDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Products.objects.all()
    serializer_class = ProductsSerializer

class ProductDashboard(APIView):
    def get(self, request, *args, **kwargs):
        total_products = Products.objects.count()
        total_stock = Products.objects.aggregate(total=Sum('TotalStock'))['total'] or 0
        top_products = Products.objects.order_by('-TotalStock')[:5].values('ProductName', 'TotalStock')
        recent_transactions = StockTransaction.objects.order_by('-created_at')[:10].values(
            'id', 'sub_variant__name', 'transaction_type', 'quantity', 'created_at'
        )
        return Response({
            'total_products': total_products,
            'total_stock': total_stock,
            'top_products_by_stock': list(top_products),
            'recent_transactions': list(recent_transactions)
        })


# --- Product Variant Views ---
class ProductVariantList(generics.ListCreateAPIView):
    serializer_class = ProductVariantSerializer

    def get_queryset(self):
        queryset = ProductVariant.objects.prefetch_related('options').all()
        product_id = self.kwargs.get('product_id')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(product_id=self.kwargs.get('product_id'))

class ProductVariantDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProductVariant.objects.prefetch_related('options').all()
    serializer_class = ProductVariantSerializer


# --- SubVariant Views ---
class SubVariantList(generics.ListCreateAPIView):
    serializer_class = SubVariantSerializer

    def get_queryset(self):
        queryset = SubVariant.objects.select_related('product').prefetch_related('options').all()
        product_id = self.kwargs.get('product_id')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset

class SubVariantDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = SubVariant.objects.select_related('product').prefetch_related('options').all()
    serializer_class = SubVariantSerializer


# --- Stock Transaction Views ---
class StockTransactionList(generics.ListCreateAPIView):
    queryset = StockTransaction.objects.all()
    serializer_class = StockTransactionSerializer

class StockTransactionDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = StockTransaction.objects.all()
    serializer_class = StockTransactionSerializer

class StockPurchase(generics.CreateAPIView):
    queryset = StockTransaction.objects.all()
    serializer_class = StockPurchaseSaleSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['transaction_type'] = 'IN'
        return context

class StockSale(generics.CreateAPIView):
    queryset = StockTransaction.objects.all()
    serializer_class = StockPurchaseSaleSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['transaction_type'] = 'OUT'
        return context

class CustomPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'

class StockReport(generics.ListAPIView):
    serializer_class = StockTransactionSerializer
    pagination_class = CustomPagination

    def get_queryset(self):
        queryset = StockTransaction.objects.select_related('sub_variant', 'sub_variant__product').order_by('-created_at')
        
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
            
        product_id = self.request.query_params.get('product_id')
        if product_id:
            queryset = queryset.filter(sub_variant__product_id=product_id)
            
        transaction_type = self.request.query_params.get('transaction_type')
        if transaction_type:
            if transaction_type.upper() == 'PURCHASE':
                queryset = queryset.filter(transaction_type='IN')
            elif transaction_type.upper() == 'SALE':
                queryset = queryset.filter(transaction_type='OUT')
                
        return queryset
