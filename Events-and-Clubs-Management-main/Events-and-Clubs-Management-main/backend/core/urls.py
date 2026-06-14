from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include

urlpatterns = [
    path('', lambda r: JsonResponse({'status': 'ok'})),
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/', include('clubs.urls')),
    path('api/', include('events.urls')),
    path('api/', include('participation.urls')),
]
