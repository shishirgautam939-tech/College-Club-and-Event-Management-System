from django.core.management.base import BaseCommand

from accounts.models import User
from clubs.models import Department


DEFAULT_DEPARTMENTS = [
    'Computer Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Electronics Engineering',
]


class Command(BaseCommand):
    help = 'Create default departments and admin user for first-time setup'

    def handle(self, *args, **options):
        created_depts = 0
        for name in DEFAULT_DEPARTMENTS:
            _, created = Department.objects.get_or_create(department_name=name)
            if created:
                created_depts += 1

        self.stdout.write(self.style.SUCCESS(
            f'Departments ready ({created_depts} newly created).'
        ))

        from django.core.management import call_command
        call_command('create_admin')

        admin = User.objects.filter(user_type='Admin').first()
        if admin:
            self.stdout.write(self.style.SUCCESS(
                f'Admin login: {admin.email} (password from DJANGO_SUPERUSER_PASSWORD env var, default: admin123)'
            ))
