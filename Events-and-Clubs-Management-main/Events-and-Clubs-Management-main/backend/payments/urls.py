from django.urls import path

from .views import InitiatePaymentView, VerifyPaymentView, MyPaymentsView

app_name = 'payments'

urlpatterns = [
    path('payments/events/<int:event_id>/initiate/',
         InitiatePaymentView.as_view(), name='initiate_payment'),
    path('payments/verify/', VerifyPaymentView.as_view(), name='verify_payment'),
    path('payments/my/', MyPaymentsView.as_view(), name='my_payments'),
]
