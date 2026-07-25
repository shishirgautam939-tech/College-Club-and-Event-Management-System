import os
import random
import sys
from datetime import timedelta
from pathlib import Path

import django

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from django.db import transaction
from django.contrib.auth.hashers import make_password
from django.utils import timezone

from accounts.models import User
from clubs.models import Club, ClubMember, Department
from events.models import Event, EventApproval
from participation.models import Attendance, EventRegistration


random.seed(2026)
PASSWORD_HASH_CACHE = {}

DEPARTMENT_NAMES = [
    "Computer Engineering",
    "Civil Engineering",
    "Electrical Engineering",
    "Electronics Engineering",
]

FACULTY_DATA = [
    ("Dr. Ramesh Karki", "ramesh.karki@nce.edu"),
    ("Dr. Sita Sharma", "sita.sharma@nce.edu"),
    ("Dr. Binod Thapa", "binod.thapa@nce.edu"),
    ("Dr. Sunita Maharjan", "sunita.maharjan@nce.edu"),
    ("Prof. Hari Bahadur", "hari.bahadur@nce.edu"),
    ("Prof. Gita Pandey", "gita.pandey@nce.edu"),
    ("Prof. Rajesh Shrestha", "rajesh.shrestha@nce.edu"),
    ("Prof. Anita Gurung", "anita.gurung@nce.edu"),
    ("Dr. Prakash Adhikari", "prakash.adhikari@nce.edu"),
    ("Dr. Meena Rai", "meena.rai@nce.edu"),
    ("Prof. Dipak Bhandari", "dipak.bhandari@nce.edu"),
    ("Prof. Kamala Khadka", "kamala.khadka@nce.edu"),
    ("Dr. Sunil Pokharel", "sunil.pokharel@nce.edu"),
    ("Dr. Laxmi Tamang", "laxmi.tamang@nce.edu"),
    ("Prof. Bikash Joshi", "bikash.joshi@nce.edu"),
    ("Prof. Sarita Regmi", "sarita.regmi@nce.edu"),
]

STAFF_DATA = [
    ("Bishnu Prasad", "bishnu.prasad@nce.edu"),
    ("Durga Tamang", "durga.tamang@nce.edu"),
    ("Indra Bahadur", "indra.bahadur@nce.edu"),
    ("Kumari Basnet", "kumari.basnet@nce.edu"),
]

CLUB_DATA = [
    ("NCE Robotics Club", "Building the future with autonomous robots and embedded systems.", False),
    ("NCE Coding Club", "Competitive programming, hackathons, and open-source contributions.", False),
    ("NCE Entrepreneurship Cell", "Fostering startup culture and innovation among students.", False),
    ("NCE Sports Club", "Organizing inter-college tournaments and promoting fitness.", False),
    ("NCE Creative Arts Society", "Photography, filmmaking, music, and performing arts.", False),
    ("NCE Debate & MUN Club", "Public speaking, parliamentary debates, and Model UN.", False),
    ("NCE Environment Club", "Green campus initiatives, tree plantation, and awareness drives.", False),
    ("NCE Student Council", "Official student governance and campus-wide coordination.", True),
]

EVENT_DATA = [
    ("Inter-College Robo Race", "Robotics competition with line-following and obstacle avoidance."),
    ("Hackathon 2026", "48-hour coding marathon to build innovative solutions."),
    ("Startup Pitch Night", "Students pitch their business ideas to a panel of judges."),
    ("NCE Premier League", "Inter-department cricket tournament."),
    ("Photography Walk", "Explore Kathmandu through the lens."),
    ("Parliamentary Debate", "Oxford-style debate on current affairs."),
    ("Tree Plantation Drive", "Plant 500 trees on campus and nearby areas."),
    ("Freshers Welcome 2026", "Cultural program and talent show for new students."),
    ("AI Workshop", "Hands-on workshop on machine learning with Python."),
    ("Code Clash", "1v1 competitive programming battle."),
    ("Women in Tech Talk", "Panel discussion with successful women in technology."),
    ("NCE Marathon", "5K fun run around the campus."),
    ("Short Film Festival", "Screening of student-made short films."),
    ("Model United Nations", "Simulate UN committees and debate global issues."),
    ("E-Waste Collection Drive", "Collect and responsibly recycle electronic waste."),
    ("Blood Donation Camp", "Annual blood donation drive in collaboration with Red Cross."),
    ("Web Dev Bootcamp", "Three-day intensive workshop on full-stack development."),
    ("Chess Tournament", "Open chess tournament for all skill levels."),
    ("Cultural Night", "Dance, music, and drama performances."),
    ("Guest Lecture: IoT", "Industry expert talk on Internet of Things applications."),
    ("CTF Cybersecurity Challenge", "Capture-the-flag security competition."),
    ("Entrepreneurship Bootcamp", "Weekend intensive on business model canvas and lean startup."),
    ("Annual Sports Day", "Track and field events across all departments."),
    ("Tech Expo 2026", "Exhibition of student projects and innovations."),
]


def env_value(name, default):
    return os.getenv(name, default).strip()


def password_hash(password):
    if password not in PASSWORD_HASH_CACHE:
        PASSWORD_HASH_CACHE[password] = make_password(password)
    return PASSWORD_HASH_CACHE[password]


def create_or_update_user(email, password, **fields):
    user, created = User.objects.get_or_create(email=email, defaults=fields)
    changed = created

    for field, value in fields.items():
        if getattr(user, field) != value:
            setattr(user, field, value)
            changed = True

    if created and password:
        user.password = password_hash(password)

    if changed:
        user.save()

    return user, created


def ensure_admin():
    email = env_value("DJANGO_SUPERUSER_EMAIL", "admin@gmail.com")
    password = env_value("DJANGO_SUPERUSER_PASSWORD", "admin")
    full_name = env_value("DJANGO_SUPERUSER_FULL_NAME", "Site Admin")

    admin, created = create_or_update_user(
        email=email,
        password=password,
        full_name=full_name,
        user_type="Admin",
        is_staff=True,
        is_superuser=True,
        is_active=True,
    )
    return admin, created


def ensure_departments():
    departments = []
    for name in DEPARTMENT_NAMES:
        department, _ = Department.objects.get_or_create(department_name=name)
        departments.append(department)
    return departments


def ensure_faculty(departments):
    faculty_users = []
    for index, (name, email) in enumerate(FACULTY_DATA):
        department = departments[index % len(departments)]
        user, _ = create_or_update_user(
            email=email,
            password="faculty123",
            full_name=name,
            user_type="Faculty",
            department=department,
            branch=None,
            roll_number=None,
            is_active=True,
        )
        faculty_users.append(user)

    for index, department in enumerate(departments):
        hod = faculty_users[index]
        if department.hod_id != hod.id:
            department.hod = hod
            department.save(update_fields=["hod"])

    return faculty_users


def ensure_students():
    branches = ["BCT", "BCE", "BEE", "BEI"]
    first_names_m = [
        "Aarav", "Bibek", "Chandan", "Deepak", "Eshan",
        "Firoj", "Ganesh", "Hemant", "Ishan", "Jeevan",
        "Kiran", "Laxman", "Manish", "Niraj", "Om",
        "Pawan", "Rabindra", "Sagar", "Tara", "Ujjwal",
    ]
    first_names_f = [
        "Aasha", "Binita", "Chandani", "Diksha", "Elina",
        "Fatima", "Ganga", "Hima", "Isha", "Jyoti",
        "Kabita", "Lina", "Mina", "Nisha", "Pramila",
        "Rashmi", "Sabina", "Trishna", "Uma", "Yamuna",
    ]
    last_names = [
        "Adhikari", "Bhandari", "Chand", "Devkota", "Ghimire",
        "Karki", "Lama", "Magar", "Nepal", "Pandey",
        "Rai", "Shrestha", "Tamang", "Thapa", "Gurung",
        "Poudel", "Rijal", "Sapkota", "Subedi", "KC",
    ]

    students = []
    for branch_index, branch in enumerate(branches):
        names_pool = first_names_m if branch_index < 2 else first_names_f
        for roll in range(1, 21):
            first_name = names_pool[(roll - 1) % len(names_pool)]
            last_name = last_names[(branch_index * 5 + roll) % len(last_names)]
            full_name = f"{first_name} {last_name}"
            roll_number = f"NCE078{branch}0{roll:02d}"
            email = f"{first_name.lower()}.{last_name.lower()}.{branch.lower()}{roll:02d}@nce.edu"
            user, _ = create_or_update_user(
                email=email,
                password="student123",
                full_name=full_name,
                user_type="Student",
                branch=branch,
                roll_number=roll_number,
                department=None,
                is_active=True,
            )
            students.append(user)

    return students


def ensure_staff():
    staff_users = []
    for name, email in STAFF_DATA:
        user, _ = create_or_update_user(
            email=email,
            password="staff123",
            full_name=name,
            user_type="Staff",
            department=None,
            branch=None,
            roll_number=None,
            is_active=True,
        )
        staff_users.append(user)
    return staff_users


def ensure_clubs(faculty_users, students):
    positions = ["President", "Vice President", "Event Manager", "Social Media Manager", "Graphics Designer"]
    clubs = []
    ordered_students = list(students)

    for index, (club_name, description, is_council) in enumerate(CLUB_DATA):
        club, _ = Club.objects.update_or_create(
            club_name=club_name,
            defaults={
                "description": description,
                "faculty_coordinator": faculty_users[index % len(faculty_users)],
                "is_council": is_council,
            },
        )
        clubs.append(club)

        club_students = ordered_students[index * 10:(index + 1) * 10]
        for member_index, student in enumerate(club_students):
            position = positions[member_index] if member_index < len(positions) else "Member"
            ClubMember.objects.update_or_create(
                club=club,
                user=student,
                defaults={"position": position},
            )

    return clubs


def event_date_for_status(status, now, index):
    if status == "Completed":
        return now - timedelta(days=10 + index * 3)
    if status == "Approved":
        return now + timedelta(days=3 + index * 2)
    return now + timedelta(days=1 + index)


def ensure_events(clubs, admin_user):
    statuses = (["Proposed"] * 6) + (["Approved"] * 8) + (["Completed"] * 7) + (["Rejected"] * 3)
    venues = [
        "Main Auditorium", "Seminar Hall A", "Seminar Hall B", "Open Ground",
        "Computer Lab 1", "Computer Lab 2", "Library Hall", "Canteen Area",
        "Block A Terrace", "Conference Room",
    ]
    max_participant_options = [30, 50, 80, 100, None]
    now = timezone.now()
    events = []

    for index, (title, description) in enumerate(EVENT_DATA):
        status = statuses[index]
        event, _ = Event.objects.update_or_create(
            title=title,
            defaults={
                "description": description,
                "organizer_type": "Club",
                "club": clubs[index % len(clubs)],
                "created_by": admin_user,
                "status": status,
                "venue": venues[index % len(venues)],
                "max_participants": max_participant_options[index % len(max_participant_options)],
                "event_date": event_date_for_status(status, now, index),
            },
        )
        events.append(event)

        if status in ("Approved", "Completed", "Rejected"):
            EventApproval.objects.update_or_create(
                event=event,
                defaults={
                    "approved_by": admin_user,
                    "remarks": "Reviewed and processed." if status != "Rejected" else "Does not meet criteria.",
                    "decision": "Approved" if status in ("Approved", "Completed") else "Rejected",
                },
            )
        else:
            EventApproval.objects.filter(event=event).delete()

    return events


def ensure_participation(events, students):
    registrations_created = 0
    attendance_created = 0

    for event_index, event in enumerate(events):
        if event.status not in ("Approved", "Completed"):
            continue

        participant_count = min(15 + (event_index % 26), len(students))
        selected_students = students[:participant_count]

        for student_index, student in enumerate(selected_students):
            _, registration_created = EventRegistration.objects.get_or_create(event=event, user=student)
            registrations_created += int(registration_created)

            if event.status == "Completed":
                _, attendance_created_now = Attendance.objects.update_or_create(
                    event=event,
                    user=student,
                    defaults={
                        "present": student_index % 4 != 0,
                        "marked_via_qr": False,
                    },
                )
                attendance_created += int(attendance_created_now)

    return registrations_created, attendance_created


def print_summary(admin_user, admin_created):
    print("\n=== SEED COMPLETE ===")
    print(f"Admin: {admin_user.email} ({'created' if admin_created else 'already existed'})")
    print(f"Users: {User.objects.count()}")
    print(
        "  "
        f"Admin={User.objects.filter(user_type='Admin').count()}, "
        f"Faculty={User.objects.filter(user_type='Faculty').count()}, "
        f"Students={User.objects.filter(user_type='Student').count()}, "
        f"Staff={User.objects.filter(user_type='Staff').count()}"
    )
    print(f"Departments: {Department.objects.count()}")
    print(f"Clubs: {Club.objects.count()}, Members: {ClubMember.objects.count()}")
    print(
        "Events: "
        f"{Event.objects.count()} "
        f"(Proposed={Event.objects.filter(status='Proposed').count()}, "
        f"Approved={Event.objects.filter(status='Approved').count()}, "
        f"Completed={Event.objects.filter(status='Completed').count()}, "
        f"Rejected={Event.objects.filter(status='Rejected').count()})"
    )
    print(f"Registrations: {EventRegistration.objects.count()}, Attendance: {Attendance.objects.count()}")


def main():
    with transaction.atomic():
        admin_user, admin_created = ensure_admin()
        departments = ensure_departments()
        faculty_users = ensure_faculty(departments)
        students = ensure_students()
        ensure_staff()
        clubs = ensure_clubs(faculty_users, students)
        events = ensure_events(clubs, admin_user)
        registrations_created, attendance_created = ensure_participation(events, students)

    print(f"Departments ready: {len(DEPARTMENT_NAMES)}")
    print(f"Faculty ready: {len(FACULTY_DATA)}")
    print(f"Students ready: {len(students)}")
    print(f"Staff ready: {len(STAFF_DATA)}")
    print(f"Clubs ready: {len(CLUB_DATA)}")
    print(f"Events ready: {len(EVENT_DATA)}")
    print(f"New registrations created this run: {registrations_created}")
    print(f"New attendance records created this run: {attendance_created}")
    print_summary(admin_user, admin_created)


if __name__ == "__main__":
    main()
