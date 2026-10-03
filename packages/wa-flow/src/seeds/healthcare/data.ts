/**
 * CityCare Hospital's dummy catalogue: the hospital itself, departments and their doctors,
 * lab packages and single tests, and vaccines. Fictional names, numbers and `.example` links.
 */
import type { IconKey } from '../../visuals';

export const HOSPITAL = {
  name: 'CityCare Hospital, Indiranagar',
  phone: '+91 80 4000 1234',
  emergency: '+91 80 4000 1080',
  address: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru 560038',
  lat: 12.9719,
  lng: 77.6412,
  website: 'https://citycare.example',
  teleconsult: 'https://citycare.example/teleconsult',
  directions: 'https://maps.citycare.example/indiranagar',
  review: 'https://reviews.citycare.example/indiranagar',
} as const;

/** The duty doctor every escalation is handed to. */
export const DUTY_DOCTOR = {
  agentName: 'Dr. Ananya Rao (Duty doctor)',
  name: 'Dr. Ananya Rao',
  phone: '+91 80 4000 1299',
  role: 'Duty doctor, Internal Medicine',
} as const;

export interface Doctor {
  id: string;
  name: string;
  qualification: string;
  years: number;
  /** Consultation fee in rupees. */
  fee: number;
  room: string;
}

export interface Department {
  key: string;
  name: string;
  description: string;
  doctors: readonly Doctor[];
}

/** Six specialities — one condition case each. General Medicine is the condition's `else`. */
export const SPECIALITIES: readonly Department[] = [
  {
    key: 'cardiology',
    name: 'Cardiology',
    description: 'Heart, BP, chest pain, ECG, echo and TMT',
    doctors: [
      {
        id: 'dr-mehta',
        name: 'Dr. Arjun Mehta',
        qualification: 'MD, DM (Cardiology)',
        years: 18,
        fee: 1200,
        room: 'Block A, Room 214',
      },
      {
        id: 'dr-pillai',
        name: 'Dr. Sneha Pillai',
        qualification: 'MD, DNB (Cardiology)',
        years: 11,
        fee: 1000,
        room: 'Block A, Room 216',
      },
      {
        id: 'dr-shetty',
        name: 'Dr. Vikram Shetty',
        qualification: 'MD, DM, FACC',
        years: 24,
        fee: 1500,
        room: 'Block A, Room 218',
      },
    ],
  },
  {
    key: 'orthopaedics',
    name: 'Orthopaedics',
    description: 'Bones, joints, back pain, fractures and sports injuries',
    doctors: [
      {
        id: 'dr-menon',
        name: 'Dr. Rahul Menon',
        qualification: 'MS (Orthopaedics)',
        years: 15,
        fee: 900,
        room: 'Block B, Room 105',
      },
      {
        id: 'dr-gowda',
        name: 'Dr. Kiran Gowda',
        qualification: 'MS, DNB · Sports medicine',
        years: 9,
        fee: 800,
        room: 'Block B, Room 107',
      },
      {
        id: 'dr-khan',
        name: 'Dr. Farah Khan',
        qualification: 'MS · Joint replacement',
        years: 20,
        fee: 1200,
        room: 'Block B, Room 109',
      },
    ],
  },
  {
    key: 'paediatrics',
    name: 'Paediatrics',
    description: 'Newborn to 18 years: fever, growth, nutrition',
    doctors: [
      {
        id: 'dr-iyer',
        name: 'Dr. Kavya Iyer',
        qualification: 'MD (Paediatrics)',
        years: 12,
        fee: 800,
        room: 'Kids Wing, Room 3',
      },
      {
        id: 'dr-joshi',
        name: 'Dr. Sameer Joshi',
        qualification: 'MD, DCH',
        years: 16,
        fee: 900,
        room: 'Kids Wing, Room 5',
      },
      {
        id: 'dr-narayan',
        name: 'Dr. Lakshmi Narayan',
        qualification: 'MD · Neonatology',
        years: 10,
        fee: 1000,
        room: 'Kids Wing, Room 7',
      },
    ],
  },
  {
    key: 'dermatology',
    name: 'Dermatology',
    description: 'Skin, hair and nail problems, allergies and acne',
    doctors: [
      {
        id: 'dr-kulkarni',
        name: 'Dr. Neha Kulkarni',
        qualification: 'MD (Dermatology)',
        years: 10,
        fee: 800,
        room: 'Block C, Room 302',
      },
      {
        id: 'dr-bhat',
        name: 'Dr. Aditya Bhat',
        qualification: 'MD, DVL · Cosmetology',
        years: 13,
        fee: 1000,
        room: 'Block C, Room 304',
      },
    ],
  },
  {
    key: 'ent',
    name: 'ENT',
    description: 'Ear, nose and throat, sinus, hearing and voice',
    doctors: [
      {
        id: 'dr-sharma',
        name: 'Dr. Priya Sharma',
        qualification: 'MS (ENT)',
        years: 14,
        fee: 800,
        room: 'Block C, Room 310',
      },
      {
        id: 'dr-reddy',
        name: 'Dr. Manoj Reddy',
        qualification: 'MS, DNB (ENT)',
        years: 8,
        fee: 700,
        room: 'Block C, Room 312',
      },
    ],
  },
  {
    key: 'gynaecology',
    name: 'Gynaecology',
    description: "Women's health, pregnancy care and fertility",
    doctors: [
      {
        id: 'dr-verma',
        name: 'Dr. Shalini Verma',
        qualification: 'MS (Obstetrics & Gynae)',
        years: 19,
        fee: 1000,
        room: 'Mother & Child, Room 12',
      },
      {
        id: 'dr-qureshi',
        name: 'Dr. Ayesha Qureshi',
        qualification: 'MD, DGO · Fertility',
        years: 12,
        fee: 1100,
        room: 'Mother & Child, Room 14',
      },
      {
        id: 'dr-sundaram',
        name: 'Dr. Meenakshi Sundaram',
        qualification: 'MS (OBG)',
        years: 22,
        fee: 1200,
        room: 'Mother & Child, Room 16',
      },
    ],
  },
];

export const GENERAL_MEDICINE: Department = {
  key: 'general-medicine',
  name: 'General Medicine',
  description: 'Fever, infections, diabetes, thyroid and check-ups',
  doctors: [
    {
      id: 'dr-babu',
      name: 'Dr. Suresh Babu',
      qualification: 'MD (General Medicine)',
      years: 20,
      fee: 700,
      room: 'OPD 1, Room 101',
    },
    {
      id: 'dr-agarwal',
      name: 'Dr. Ritu Agarwal',
      qualification: 'MD (Internal Medicine)',
      years: 9,
      fee: 600,
      room: 'OPD 1, Room 103',
    },
    {
      id: 'dr-sheikh',
      name: 'Dr. Imran Sheikh',
      qualification: 'MD · Diabetology',
      years: 14,
      fee: 800,
      room: 'OPD 1, Room 105',
    },
  ],
};

/** Something bookable with a price: a lab package, a single test or a vaccine. */
export interface Bookable {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  mrp: number;
  badge?: string;
  icon: IconKey;
  /** `yes` when the test needs 10–12 hours of fasting. */
  fasting: 'yes' | 'no';
  reportEta: string;
}

export const LAB_PACKAGES: readonly Bookable[] = [
  {
    id: 'full-body',
    title: 'Full Body Checkup',
    subtitle: '82 tests · CBC, lipid, liver, kidney, thyroid, HbA1c',
    price: 1999,
    mrp: 3500,
    badge: 'Bestseller',
    icon: 'lab',
    fasting: 'yes',
    reportEta: '24 hours',
  },
  {
    id: 'diabetes',
    title: 'Diabetes Care',
    subtitle: '9 tests · fasting sugar, HbA1c, kidney markers',
    price: 899,
    mrp: 1400,
    badge: 'Save 36%',
    icon: 'pill',
    fasting: 'yes',
    reportEta: '12 hours',
  },
  {
    id: 'thyroid',
    title: 'Thyroid Profile',
    subtitle: 'T3, T4 and TSH',
    price: 499,
    mrp: 900,
    icon: 'search',
    fasting: 'no',
    reportEta: '12 hours',
  },
  {
    id: 'heart',
    title: 'Heart Health',
    subtitle: '14 tests · lipid profile, hs-CRP, ECG at centre',
    price: 1499,
    mrp: 2600,
    badge: 'Doctor pick',
    icon: 'heart',
    fasting: 'yes',
    reportEta: '24 hours',
  },
  {
    id: 'vitamins',
    title: 'Vitamin Profile',
    subtitle: 'Vitamin D, B12, iron studies and calcium',
    price: 1199,
    mrp: 2000,
    icon: 'check',
    fasting: 'no',
    reportEta: '24 hours',
  },
];

export const BLOOD_TESTS: readonly Bookable[] = [
  {
    id: 'cbc',
    title: 'Complete Blood Count',
    subtitle: 'Haemoglobin, WBC, platelets',
    price: 349,
    mrp: 500,
    icon: 'lab',
    fasting: 'no',
    reportEta: '6 hours',
  },
  {
    id: 'lipid',
    title: 'Lipid Profile',
    subtitle: 'Cholesterol, HDL, LDL, triglycerides',
    price: 599,
    mrp: 900,
    icon: 'heart',
    fasting: 'yes',
    reportEta: '12 hours',
  },
  {
    id: 'lft',
    title: 'Liver Function Test',
    subtitle: 'SGOT, SGPT, bilirubin, proteins',
    price: 649,
    mrp: 950,
    icon: 'lab',
    fasting: 'no',
    reportEta: '12 hours',
  },
  {
    id: 'kft',
    title: 'Kidney Function Test',
    subtitle: 'Creatinine, urea, uric acid, electrolytes',
    price: 699,
    mrp: 1000,
    icon: 'lab',
    fasting: 'no',
    reportEta: '12 hours',
  },
  {
    id: 'hba1c',
    title: 'HbA1c',
    subtitle: 'Average blood sugar over 3 months',
    price: 449,
    mrp: 650,
    icon: 'pill',
    fasting: 'no',
    reportEta: '6 hours',
  },
  {
    id: 'fbs',
    title: 'Fasting Blood Sugar',
    subtitle: 'Glucose after 10–12 hours of fasting',
    price: 149,
    mrp: 250,
    icon: 'pill',
    fasting: 'yes',
    reportEta: '6 hours',
  },
  {
    id: 'vit-d',
    title: 'Vitamin D (25-OH)',
    subtitle: 'Bone health and immunity',
    price: 899,
    mrp: 1400,
    icon: 'check',
    fasting: 'no',
    reportEta: '24 hours',
  },
  {
    id: 'tsh',
    title: 'TSH',
    subtitle: 'Thyroid screening',
    price: 299,
    mrp: 450,
    icon: 'search',
    fasting: 'no',
    reportEta: '12 hours',
  },
];

export const OTHER_TESTS: readonly Bookable[] = [
  {
    id: 'urine',
    title: 'Urine Routine',
    subtitle: 'Infection, sugar and protein screen',
    price: 199,
    mrp: 300,
    icon: 'lab',
    fasting: 'no',
    reportEta: '6 hours',
  },
  {
    id: 'crp',
    title: 'C-Reactive Protein',
    subtitle: 'Inflammation and infection marker',
    price: 499,
    mrp: 700,
    icon: 'lab',
    fasting: 'no',
    reportEta: '12 hours',
  },
  {
    id: 'dengue',
    title: 'Dengue NS1 Antigen',
    subtitle: 'Early dengue detection, days 1–5 of fever',
    price: 899,
    mrp: 1200,
    icon: 'warning',
    fasting: 'no',
    reportEta: '8 hours',
  },
];

export interface Vaccine {
  id: string;
  name: string;
  detail: string;
  price: number;
  mrp: number;
  doses: string;
  badge?: string;
}

/** A child's vaccines, by the order they fall due. */
export const CHILD_DUE: readonly Vaccine[] = [
  {
    id: 'mmr-1',
    name: 'MMR-1',
    detail: 'Measles, mumps, rubella · due at 9 months',
    price: 850,
    mrp: 950,
    doses: '1 of 3',
  },
  {
    id: 'tcv',
    name: 'Typhoid conjugate',
    detail: 'Single dose · due at 9–12 months',
    price: 1850,
    mrp: 2100,
    doses: '1 of 1',
  },
  {
    id: 'flu-kids',
    name: 'Influenza (paediatric)',
    detail: 'Yearly · overdue for this season',
    price: 1400,
    mrp: 1600,
    doses: 'Yearly',
  },
];

export const CHILD_UPCOMING: readonly Vaccine[] = [
  {
    id: 'hep-a',
    name: 'Hepatitis A-1',
    detail: 'Due at 12 months',
    price: 1650,
    mrp: 1900,
    doses: '1 of 2',
  },
  {
    id: 'pcv-b',
    name: 'PCV booster',
    detail: 'Pneumococcal · due at 12–15 months',
    price: 3800,
    mrp: 4200,
    doses: 'Booster',
  },
  {
    id: 'varicella',
    name: 'Varicella-1',
    detail: 'Chickenpox · due at 15 months',
    price: 2100,
    mrp: 2400,
    doses: '1 of 2',
  },
];

export const ADULT_VACCINES: readonly Vaccine[] = [
  {
    id: 'flu',
    name: 'Influenza (quadrivalent)',
    detail: "This season's strains · one shot a year",
    price: 1600,
    mrp: 1900,
    doses: 'Yearly',
    badge: 'Seasonal',
  },
  {
    id: 'hpv',
    name: 'HPV (9-valent)',
    detail: 'Cervical and other HPV cancers · ages 9–45',
    price: 10850,
    mrp: 11500,
    doses: '3 doses',
    badge: 'Recommended',
  },
  {
    id: 'hep-b',
    name: 'Hepatitis B',
    detail: 'Liver protection · 0, 1 and 6 months',
    price: 450,
    mrp: 600,
    doses: '3 doses',
  },
  {
    id: 'covid',
    name: 'COVID-19 booster',
    detail: 'For adults 60+ or with chronic illness',
    price: 780,
    mrp: 900,
    doses: '1 dose',
  },
];

/** `₹1,200` — for row descriptions, which are plain text. */
export const rupees = (amount: number): string => `₹${amount.toLocaleString('en-IN')}`;
