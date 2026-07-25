from django.contrib import admin

from .models import PaymentTransaction


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ('purchase_order_id', 'user', 'event', 'amount',
                    'status', 'transaction_id', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('purchase_order_id', 'pidx', 'transaction_id',
                     'user__email', 'event__title')
    readonly_fields = ('pidx', 'transaction_id', 'purchase_order_id',
                       'amount', 'amount_paisa', 'initiate_response',
                       'verification_response', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'
