import os

from django.core.management.base import BaseCommand

from accounts.models import User


class Command(BaseCommand):
    help = 'Create admin user from env vars if not exists'

    def handle(self, *args, **options):
        email = os.getenv('DJANGO_SUPERUSER_EMAIL')
        password = os.getenv('DJANGO_SUPERUSER_PASSWORD')
        full_name = os.getenv('DJANGO_SUPERUSER_FULL_NAME', 'Site Admin')
        user_type = os.getenv('DJANGO_SUPERUSER_USER_TYPE', 'Admin')

        if not email or not password:
            self.stdout.write(self.style.WARNING('DJANGO_SUPERUSER_EMAIL or DJANGO_SUPERUSER_PASSWORD not set; skipping'))
            return

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.SUCCESS(f'Superuser already exists: {email}'))
            return

        try:
            u = User.objects.create_superuser(
                email=email,
                password=password,
                full_name=full_name,
                user_type=user_type,
            )
            u.is_staff = True
            u.is_superuser = True
            u.save()
            self.stdout.write(self.style.SUCCESS(f'Created superuser: {email}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to create superuser: {e}'))
