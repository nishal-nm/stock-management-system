import itertools
from .models import Products, ProductVariant, VariantOption, SubVariant

def generate_sub_variants_for_product(product):
    variants = product.variants.prefetch_related('options').all()
    if not variants:
        return

    # List of lists of options
    options_lists = [list(variant.options.all()) for variant in variants if variant.options.exists()]
    if not options_lists:
        return

    # Cartesian product of options
    combinations = list(itertools.product(*options_lists))

    existing_subvariants = SubVariant.objects.filter(product=product).prefetch_related('options')
    
    # We want to identify the exact expected option IDs for each valid combination
    expected_combinations = []
    for combination in combinations:
        expected_combinations.append(set(opt.id for opt in combination))
        
    # Delete subvariants that don't match any expected combination
    for sv in existing_subvariants:
        sv_option_ids = set(sv.options.values_list('id', flat=True))
        if sv_option_ids not in expected_combinations:
            sv.delete()

    # Re-fetch existing after deletion to avoid attempting to keep deleted ones
    existing_subvariants = SubVariant.objects.filter(product=product).prefetch_related('options')
    existing_option_sets = []
    for sv in existing_subvariants:
        existing_option_sets.append(set(sv.options.values_list('id', flat=True)))

    for combination in combinations:
        option_ids = set([opt.id for opt in combination])
        if option_ids in existing_option_sets:
            continue
        
        # Create new subvariant
        name = " - ".join([f"{opt.variant.name}: {opt.value}" for opt in combination])
        new_sv = SubVariant.objects.create(
            product=product,
            name=name
        )
        new_sv.options.set(combination)
