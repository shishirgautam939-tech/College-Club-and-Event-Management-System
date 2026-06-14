import os, sys, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

import random
from datetime import timedelta
from django.utils import timezone
from accounts.models import User
from clubs.models import Club, ClubMember, Department
from events.models import Event, EventApproval
from participation.models import EventRegistration, Attendance

# ── Guard: skip if already seeded ──
if User.objects.filter(user_type="Faculty").exists():
    print("Database already seeded — skipping.")
    sys.exit(0)

# ── Departments ──
dept_names = ["Computer Engineering", "Civil Engineering", "Electrical Engineering", "Electronics Engineering"]
for name in dept_names:
    Department.objects.get_or_create(department_name=name)
depts = list(Department.objects.all())
print(f"Departments: {[d.department_name for d in depts]}")

# ── Faculty (16 faculty, 4 per dept) ──
faculty_names = [
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

faculty_users = []
for i, (name, email) in enumerate(faculty_names):
    dept = depts[i % len(depts)]
    u = User.objects.create_user(
        email=email, password="faculty123",
        full_name=name, user_type="Faculty",
        department=dept
    )
    faculty_users.append(u)
print(f"Created {len(faculty_users)} faculty members")

# ── Students (80 students, 20 per branch) ──
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
for b_idx, branch in enumerate(branches):
    names_pool = first_names_m if b_idx < 2 else first_names_f
    for roll in range(1, 21):
        fn = names_pool[(roll - 1) % len(names_pool)]
        ln = last_names[(b_idx * 5 + roll) % len(last_names)]
        full_name = f"{fn} {ln}"
        roll_str = f"NCE078{branch}0{roll:02d}"
        email = f"{fn.lower()}.{ln.lower()}.{branch.lower()}{roll:02d}@nce.edu"
        u = User.objects.create_user(
            email=email, password="student123",
            full_name=full_name, user_type="Student",
            branch=branch, roll_number=roll_str,
        )
        students.append(u)
print(f"Created {len(students)} students")

# ── Staff (4) ──
staff_data = [
    ("Bishnu Prasad", "bishnu.prasad@nce.edu"),
    ("Durga Tamang", "durga.tamang@nce.edu"),
    ("Indra Bahadur", "indra.bahadur@nce.edu"),
    ("Kumari Basnet", "kumari.basnet@nce.edu"),
]
for name, email in staff_data:
    User.objects.create_user(email=email, password="staff123",
                             full_name=name, user_type="Staff")
print(f"Created {len(staff_data)} staff")

# ── Clubs (8 clubs) ──
club_defs = [
    ("NCE Robotics Club", "Building the future with autonomous robots and embedded systems.", False),
    ("NCE Coding Club", "Competitive programming, hackathons, and open-source contributions.", False),
    ("NCE Entrepreneurship Cell", "Fostering startup culture and innovation among students.", False),
    ("NCE Sports Club", "Organizing inter-college tournaments and promoting fitness.", False),
    ("NCE Creative Arts Society", "Photography, filmmaking, music, and performing arts.", False),
    ("NCE Debate & MUN Club", "Public speaking, parliamentary debates, and Model UN.", False),
    ("NCE Environment Club", "Green campus initiatives, tree plantation, and awareness drives.", False),
    ("NCE Student Council", "Official student governance and campus-wide coordination.", True),
]

positions = ["President", "Vice President", "Event Manager", "Social Media Manager", "Graphics Designer"]
clubs_created = []
random.shuffle(students)
assigned = set()

for i, (cname, desc, is_council) in enumerate(club_defs):
    coordinator = faculty_users[i % len(faculty_users)]
    club = Club.objects.create(
        club_name=cname, description=desc,
        faculty_coordinator=coordinator, is_council=is_council,
    )
    clubs_created.append(club)

    # 5 designated + 5 regular = 10 per club
    club_students = []
    for s in students:
        if s.id not in assigned:
            club_students.append(s)
            assigned.add(s.id)
            if len(club_students) == 10:
                break

    for j, s in enumerate(club_students):
        pos = positions[j] if j < 5 else "Member"
        ClubMember.objects.create(club=club, user=s, position=pos)

print(f"Created {len(clubs_created)} clubs, {ClubMember.objects.count()} memberships")

# ── Events (24) ──
event_data = [
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

statuses = (["Proposed"] * 6) + (["Approved"] * 8) + (["Completed"] * 7) + (["Rejected"] * 3)
random.shuffle(statuses)

venues = [
    "Main Auditorium", "Seminar Hall A", "Seminar Hall B", "Open Ground",
    "Computer Lab 1", "Computer Lab 2", "Library Hall", "Canteen Area",
    "Block A Terrace", "Conference Room",
]

admin_user = User.objects.filter(user_type="Admin").first()
now = timezone.now()
events_created = []

for i, (title, desc) in enumerate(event_data):
    club = clubs_created[i % len(clubs_created)]
    st = statuses[i % len(statuses)]

    if st == "Completed":
        event_date = now - timedelta(days=random.randint(10, 90))
    elif st == "Approved":
        event_date = now + timedelta(days=random.randint(3, 60))
    else:
        event_date = now + timedelta(days=random.randint(1, 45))

    evt = Event.objects.create(
        title=title, description=desc,
        organizer_type="Club", club=club,
        created_by=admin_user, status=st,
        venue=venues[i % len(venues)],
        max_participants=random.choice([30, 50, 80, 100, None]),
        event_date=event_date,
    )
    events_created.append(evt)

    if st in ("Approved", "Completed", "Rejected"):
        EventApproval.objects.create(
            event=evt, approved_by=admin_user,
            remarks="Reviewed and processed." if st != "Rejected" else "Does not meet criteria.",
            decision="Approved" if st in ("Approved", "Completed") else "Rejected",
        )

print(f"Created {len(events_created)} events")

# ── Registrations & Attendance ──
all_students = list(User.objects.filter(user_type="Student"))
reg_count = 0
att_count = 0

for evt in events_created:
    if evt.status in ("Approved", "Completed"):
        num_reg = random.randint(15, min(40, len(all_students)))
        reg_students = random.sample(all_students, num_reg)
        regs = [EventRegistration(event=evt, user=s) for s in reg_students]
        EventRegistration.objects.bulk_create(regs, ignore_conflicts=True)
        reg_count += len(regs)

        if evt.status == "Completed":
            atts = [Attendance(event=evt, user=s, present=(random.random() < 0.75)) for s in reg_students]
            Attendance.objects.bulk_create(atts, ignore_conflicts=True)
            att_count += len(atts)

print(f"Created {reg_count} registrations, {att_count} attendance records")

print("\n=== SEED COMPLETE ===")
print(f"Users: {User.objects.count()}")
print(f"  Admin={User.objects.filter(user_type='Admin').count()}, Faculty={User.objects.filter(user_type='Faculty').count()}, Students={User.objects.filter(user_type='Student').count()}, Staff={User.objects.filter(user_type='Staff').count()}")
print(f"Clubs: {Club.objects.count()}, Members: {ClubMember.objects.count()}")
print(f"Events: {Event.objects.count()} (Proposed={Event.objects.filter(status='Proposed').count()}, Approved={Event.objects.filter(status='Approved').count()}, Completed={Event.objects.filter(status='Completed').count()}, Rejected={Event.objects.filter(status='Rejected').count()})")
print(f"Registrations: {EventRegistration.objects.count()}, Attendance: {Attendance.objects.count()}")
