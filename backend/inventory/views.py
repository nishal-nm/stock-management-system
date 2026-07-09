from django.http import Http404
import logging
logger = logging.getLogger('inventory')
from django.db.models import Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from .models import Category, Products, ProductVariant, SubVariant, StockTransaction
from .serializers import (
    CategorySerializer, 
    ProductReadSerializer, 
    ProductWriteSerializer,
    ProductVariantSerializer, 
    SubVariantSerializer, 
    StockTransactionSerializer, 
    StockPurchaseSaleSerializer
)

# --- utility classes ---
class CustomPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


# --- Category Views ---
class CategoryList(APIView):
    def get(self, request):
        queryset = Category.objects.all().order_by('id')
        paginator = CustomPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        if page is not None:
            serializer = CategorySerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        serializer = CategorySerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = CategorySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            category = serializer.save()
            logger.info(f"Category created: '{category.name}' (ID: {category.id})")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoryDetail(APIView):
    def get_object(self, pk):
        try:
            return Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            raise Http404

    def get(self, request, pk):
        category = self.get_object(pk)
        serializer = CategorySerializer(category, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk):
        return self.update(request, pk, partial=False)

    def patch(self, request, pk):
        return self.update(request, pk, partial=True)

    def update(self, request, pk, partial=False):
        category = self.get_object(pk)
        serializer = CategorySerializer(category, data=request.data, partial=partial, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Category updated: '{category.name}' (ID: {category.id}, partial={partial})")
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        category = self.get_object(pk)
        category_name = category.name
        category.delete()
        logger.info(f"Category deleted: '{category_name}' (ID: {pk})")
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- Products Views ---
class ProductList(APIView):
    queryset = Products.objects.filter(Active=True)
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = (
        "ProductName",
        "ProductCode",
    )
    filterset_fields = {
        "Category": ["exact"],
    }

    def filter_queryset(self, queryset):
        for backend in self.filter_backends:
            queryset = backend().filter_queryset(self.request, queryset, self)
        return queryset

    def get(self, request):
        queryset = Products.objects.filter(Active=True)
        queryset = self.filter_queryset(queryset)
        paginator = CustomPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        if page is not None:
            serializer = ProductReadSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        serializer = ProductReadSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = ProductWriteSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            product = serializer.save(CreatedUser=request.user)
            logger.info(f"Product created: '{product.ProductName}' (ID: {product.id}) by user '{request.user.username}'")
            read_serializer = ProductReadSerializer(product, context={'request': request})
            return Response(read_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductDetail(APIView):
    def get_object(self, pk):
        try:
            return Products.objects.select_related("Category").prefetch_related(
                "variants__options",
                "sub_variants__options",
            ).get(pk=pk, Active=True)
            
        except Products.DoesNotExist:
            raise Http404

    def get(self, request, pk):
        product = self.get_object(pk)
        serializer = ProductReadSerializer(product, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk):
        return self.update(request, pk, partial=False)

    def patch(self, request, pk):
        return self.update(request, pk, partial=True)

    def update(self, request, pk, partial=False):
        product = self.get_object(pk)
        serializer = ProductWriteSerializer(product, data=request.data, partial=partial, context={'request': request})
        if serializer.is_valid():
            product = serializer.save()
            logger.info(f"Product updated: '{product.ProductName}' (ID: {product.id}, partial={partial})")
            read_serializer = ProductReadSerializer(product, context={'request': request})
            return Response(read_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not request.user.is_staff:
            return Response({"detail": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
        product = self.get_object(pk)
        product.Active = False
        product.save(update_fields=["Active"])
        logger.info(f"Product soft-deleted: '{product.ProductName}' (ID: {pk})")
        return Response(
            {
                "success": True,
                "message": "Product deleted successfully."
            },
            status=status.HTTP_200_OK
        )


class ProductDashboard(APIView):
    def get(self, request, *args, **kwargs):
        import datetime
        from django.utils import timezone
        from django.db.models import F
        from django.db.models.functions import TruncDate

        # Real Total Products (Active only)
        total_products = Products.objects.filter(Active=True).count()
        
        # Real Total Stock Units
        total_stock = Products.objects.filter(Active=True).aggregate(total=Sum('TotalStock'))['total'] or 0
        total_stock = float(total_stock)
        
        # Top 5 products by stock
        top_products = Products.objects.filter(Active=True).order_by('-TotalStock')[:5].values('id', 'ProductName', 'TotalStock')
        
        # Recent 10 transactions
        recent_transactions = StockTransaction.objects.select_related('sub_variant', 'sub_variant__product').filter(sub_variant__product__Active=True).order_by('-created_at')[:10]
        
        # Low Stock count (Subvariants with stock <= low_stock_threshold)
        low_stock_count = SubVariant.objects.filter(
            product__Active=True,
            stock__lte=F('low_stock_threshold')
        ).count()
        
        # Today's transaction count
        today = timezone.now().date()
        transactions_today = StockTransaction.objects.filter(created_at__date=today, sub_variant__product__Active=True).count()
        
        # Calculate last 7 days cumulative stock level
        end_date = today
        start_date = end_date - datetime.timedelta(days=6)
        
        range_transactions = StockTransaction.objects.filter(
            created_at__date__range=[start_date, end_date],
            sub_variant__product__Active=True
        ).annotate(date=TruncDate('created_at')).values('date', 'transaction_type').annotate(total=Sum('quantity'))
        
        tx_map = {}
        for tx in range_transactions:
            dt = tx['date']
            tt = tx['transaction_type']
            val = float(tx['total'])
            if dt not in tx_map:
                tx_map[dt] = {'IN': 0.0, 'OUT': 0.0}
            tx_map[dt][tt] = val
            
        temp_data = []
        running_stock = total_stock
        for i in range(7):
            d = end_date - datetime.timedelta(days=i)
            temp_data.append({
                'name': d.strftime('%b %d'),
                'stock': max(0.0, running_stock)
            })
            day_tx = tx_map.get(d, {'IN': 0.0, 'OUT': 0.0})
            net_change = day_tx['IN'] - day_tx['OUT']
            running_stock -= net_change
            
        chart_data = list(reversed(temp_data))
        
        serialized_recent_txs = []
        for tx in recent_transactions:
            serialized_recent_txs.append({
                'id': f"TX-{str(tx.id).split('-')[0].upper()}",
                'type': tx.transaction_type,
                'product': f"{tx.sub_variant.product.ProductName} ({tx.sub_variant.name})",
                'qty': float(tx.quantity),
                'date': tx.created_at.strftime('%Y-%m-%d'),
            })

        serialized_top_products = []
        for p in top_products:
            serialized_top_products.append({
                'id': str(p['id']),
                'name': p['ProductName'],
                'stock': float(p['TotalStock']),
                'value': float(p['TotalStock']) * 100.0, # base valuation reference
            })

        return Response({
            'total_products': total_products,
            'total_stock': total_stock,
            'low_stock_count': low_stock_count,
            'transactions_today': transactions_today,
            'top_products_by_stock': serialized_top_products,
            'recent_transactions': serialized_recent_txs,
            'chart_data': chart_data
        })


# --- Product Variant Views ---
class ProductVariantList(APIView):
    def get(self, request, product_id):
        queryset = ProductVariant.objects.prefetch_related('options').filter(product_id=product_id).order_by('id')
        paginator = CustomPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        if page is not None:
            serializer = ProductVariantSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        serializer = ProductVariantSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, product_id):
        serializer = ProductVariantSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(product_id=product_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductVariantDetail(APIView):
    def get_object(self, pk):
        try:
            return ProductVariant.objects.prefetch_related('options').get(pk=pk)
        except ProductVariant.DoesNotExist:
            raise Http404

    def get(self, request, pk):
        variant = self.get_object(pk)
        serializer = ProductVariantSerializer(variant, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk):
        return self.update(request, pk, partial=False)

    def patch(self, request, pk):
        return self.update(request, pk, partial=True)

    def update(self, request, pk, partial=False):
        variant = self.get_object(pk)
        serializer = ProductVariantSerializer(variant, data=request.data, partial=partial, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        variant = self.get_object(pk)
        variant.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- SubVariant Views ---
class SubVariantList(APIView):
    def get(self, request, product_id):
        queryset = SubVariant.objects.select_related('product').prefetch_related('options').filter(product_id=product_id).order_by('id')
        paginator = CustomPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        if page is not None:
            serializer = SubVariantSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        serializer = SubVariantSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, product_id):
        serializer = SubVariantSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(product_id=product_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SubVariantDetail(APIView):
    def get_object(self, pk):
        try:
            return SubVariant.objects.select_related('product').prefetch_related('options').get(pk=pk)
        except SubVariant.DoesNotExist:
            raise Http404

    def get(self, request, pk):
        subvariant = self.get_object(pk)
        serializer = SubVariantSerializer(subvariant, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk):
        return self.update(request, pk, partial=False)

    def patch(self, request, pk):
        return self.update(request, pk, partial=True)

    def update(self, request, pk, partial=False):
        subvariant = self.get_object(pk)
        serializer = SubVariantSerializer(subvariant, data=request.data, partial=partial, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        subvariant = self.get_object(pk)
        subvariant.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- Stock Transaction Views ---
class StockTransactionList(APIView):
    def get(self, request):
        queryset = StockTransaction.objects.all().order_by('-created_at')
        paginator = CustomPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        if page is not None:
            serializer = StockTransactionSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        serializer = StockTransactionSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = StockTransactionSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StockTransactionDetail(APIView):
    def get_object(self, pk):
        try:
            return StockTransaction.objects.get(pk=pk)
        except StockTransaction.DoesNotExist:
            raise Http404

    def get(self, request, pk):
        transaction = self.get_object(pk)
        serializer = StockTransactionSerializer(transaction, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk):
        return self.update(request, pk, partial=False)

    def patch(self, request, pk):
        return self.update(request, pk, partial=True)

    def update(self, request, pk, partial=False):
        transaction = self.get_object(pk)
        serializer = StockTransactionSerializer(transaction, data=request.data, partial=partial, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        transaction = self.get_object(pk)
        transaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StockPurchase(APIView):
    def post(self, request):
        serializer = StockPurchaseSaleSerializer(
            data=request.data, 
            context={'request': request, 'transaction_type': 'IN'}
        )
        if serializer.is_valid():
            transaction = serializer.save()
            logger.info(f"Stock PURCHASE (IN) transaction recorded: {transaction.quantity} units added to SubVariant '{transaction.sub_variant.name}' (ID: {transaction.sub_variant.id})")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StockSale(APIView):
    def post(self, request):
        serializer = StockPurchaseSaleSerializer(
            data=request.data, 
            context={'request': request, 'transaction_type': 'OUT'}
        )
        if serializer.is_valid():
            transaction = serializer.save()
            logger.info(f"Stock SALE (OUT) transaction recorded: {transaction.quantity} units deducted from SubVariant '{transaction.sub_variant.name}' (ID: {transaction.sub_variant.id})")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StockReport(APIView):
    def get(self, request):
        if not request.user.is_staff:
            return Response({"detail": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
        queryset = StockTransaction.objects.select_related('sub_variant', 'sub_variant__product').filter(sub_variant__product__Active=True).order_by('-created_at')
        
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
            
        product_id = request.query_params.get('product_id')
        if product_id:
            queryset = queryset.filter(sub_variant__product_id=product_id)
            
        transaction_type = request.query_params.get('transaction_type')
        if transaction_type:
            if transaction_type.upper() == 'PURCHASE':
                queryset = queryset.filter(transaction_type='IN')
            elif transaction_type.upper() == 'SALE':
                queryset = queryset.filter(transaction_type='OUT')
                
        paginator = CustomPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        if page is not None:
            serializer = StockTransactionSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        serializer = StockTransactionSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

