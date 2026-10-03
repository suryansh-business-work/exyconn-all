/**
 * BrightPath Academy's dummy data: the centre, counsellors, courses by track (with fees,
 * batches and durations), classes, and a student's fee plan.
 * Fictional names, numbers and `.example` links.
 */
import type { IconKey } from '../../visuals';

export const ACADEMY = {
  name: 'BrightPath Academy, Erandwane',
  phone: '+91 20 6720 4400',
  address: 'Karve Road, near Nal Stop, Erandwane, Pune 411004',
  lat: 18.5089,
  lng: 73.8259,
  website: 'https://brightpath.example',
  demoRoom: 'https://meet.brightpath.example/demo',
  portal: 'https://portal.brightpath.example',
  recordings: 'https://brightpath.example/sample-classes',
} as const;

export const COUNSELLOR = {
  agentName: 'Sneha (Academic counsellor)',
  name: 'Sneha Kulkarni',
  phone: '+91 98230 66120',
  role: 'Senior academic counsellor',
} as const;

export const ACCOUNTS = {
  agentName: 'Rahul (Fees and accounts)',
  name: 'Rahul Bhosale',
  phone: '+91 98230 66140',
  role: 'Accounts desk',
} as const;

export interface Course {
  id: string;
  name: string;
  description: string;
  /** Who it is for, e.g. "Class 11–12". */
  grades: string;
  duration: string;
  /** Annual fee in rupees. */
  fee: number;
  batches: string;
  icon: IconKey;
}

export interface Track {
  id: string;
  title: string;
  courses: readonly Course[];
}

export const TRACKS: readonly Track[] = [
  {
    id: 'competitive',
    title: 'Entrance exams',
    courses: [
      {
        id: 'jee',
        name: 'JEE Main + Advanced',
        description: 'Physics, Chemistry, Maths · IIT faculty',
        grades: 'Class 11–12',
        duration: '2 years',
        fee: 125000,
        batches: 'Mon–Sat, 4–7 pm',
        icon: 'school',
      },
      {
        id: 'neet',
        name: 'NEET (Medical)',
        description: 'Physics, Chemistry, Biology · NCERT-first',
        grades: 'Class 11–12',
        duration: '2 years',
        fee: 115000,
        batches: 'Mon–Sat, 4–7 pm',
        icon: 'stethoscope',
      },
      {
        id: 'cet',
        name: 'MHT-CET',
        description: 'State engineering and pharmacy entrance',
        grades: 'Class 12',
        duration: '1 year',
        fee: 48000,
        batches: 'Weekends, 9 am – 1 pm',
        icon: 'book',
      },
      {
        id: 'dropper',
        name: 'JEE/NEET Repeater',
        description: 'Full-day programme for a second attempt',
        grades: 'After Class 12',
        duration: '10 months',
        fee: 135000,
        batches: 'Mon–Sat, 9 am – 4 pm',
        icon: 'star',
      },
    ],
  },
  {
    id: 'school',
    title: 'School',
    courses: [
      {
        id: 'foundation',
        name: 'Foundation (8–10)',
        description: 'Maths and Science, board + Olympiad',
        grades: 'Class 8–10',
        duration: '1 year',
        fee: 54000,
        batches: 'Mon, Wed, Fri, 5–7 pm',
        icon: 'book',
      },
      {
        id: 'boards',
        name: 'Board Booster (10, 12)',
        description: 'Revision, sample papers and doubt clinics',
        grades: 'Class 10 and 12',
        duration: '6 months',
        fee: 28000,
        batches: 'Tue, Thu, Sat, 5–7 pm',
        icon: 'document',
      },
    ],
  },
  {
    id: 'skills',
    title: 'Skills',
    courses: [
      {
        id: 'coding',
        name: 'Coding for Kids',
        description: 'Python, games and apps · ages 8–14',
        grades: 'Class 3–9',
        duration: '6 months',
        fee: 24000,
        batches: 'Weekends, 11 am – 1 pm',
        icon: 'laptop',
      },
      {
        id: 'english',
        name: 'Spoken English',
        description: 'Fluency, public speaking and interviews',
        grades: 'Class 6 and above',
        duration: '3 months',
        fee: 12000,
        batches: 'Tue, Thu, 6–7:30 pm',
        icon: 'chat',
      },
    ],
  },
];

export const ALL_COURSES: readonly Course[] = TRACKS.flatMap((t) => t.courses);

/** Taken with an application; adjusted in the first instalment. */
export const REGISTRATION_FEE = 1000;

export const CLASSES = [
  { id: 'c5', title: 'Class 5 or below' },
  { id: 'c6', title: 'Class 6' },
  { id: 'c7', title: 'Class 7' },
  { id: 'c8', title: 'Class 8' },
  { id: 'c9', title: 'Class 9' },
  { id: 'c10', title: 'Class 10' },
  { id: 'c11', title: 'Class 11' },
  { id: 'c12', title: 'Class 12' },
  { id: 'c13', title: 'Passed Class 12' },
] as const;

/** A sample student's fee plan, for the fee-reminder journey. */
export const FEE_PLAN = {
  course: 'JEE Main + Advanced',
  batch: 'JEE-2027 B2',
  total: 125000,
  instalments: [
    { id: 'i1', label: 'Instalment 1 (at admission)', amount: 45000, status: 'Paid' },
    { id: 'i2', label: 'Instalment 2', amount: 42000, status: 'Due' },
    { id: 'i3', label: 'Instalment 3', amount: 38000, status: 'Upcoming' },
  ],
  due: 42000,
  scholarship: 4200,
} as const;

/** Every course as a list row that stores the course for the rest of the flow. */
export const courseRow = (course: Course) => ({
  id: course.id,
  title: course.name,
  description: `${course.grades} · ${course.description}`,
  set: {
    course: course.name,
    courseGrades: course.grades,
    courseFee: String(course.fee),
    batches: course.batches,
    duration: course.duration,
  },
});

export const courseSections = () =>
  TRACKS.map((t) => ({ id: t.id, title: t.title, rows: t.courses.map(courseRow) }));
