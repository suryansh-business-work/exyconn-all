import type { Estimate } from '@exyconn/gcc-cost';

const NOW = '2026-10-14T00:00:00.000Z';

/**
 * A one-scenario estimate small enough to work out by hand: ten engineers at INR 12 lakh a
 * year, all-inclusive, from month 1, and nothing else — so the 12-month forecast is
 * INR 1,20,00,000 and the monthly operating cost INR 10,00,000.
 */
export const gccEstimate = (overrides: Partial<Estimate> = {}): Estimate => ({
  schemaVersion: 1,
  appVersion: 'test',
  id: 'estimate-1',
  name: 'Pune GCC',
  company: { companyName: 'Acme', parentCountry: 'United Kingdom', industry: '', purpose: '' },
  reportingCurrency: 'INR',
  fxRates: [],
  scenarios: [
    {
      id: 'standard',
      name: 'Standard',
      profile: {
        operatingModel: 'captive',
        launchDate: '',
        launchTimeline: '',
        initialHeadcount: 10,
        targetHeadcountYear3: 10,
        workingModel: 'remote',
        shiftPattern: 'general',
      },
      office: {
        city: 'Pune',
        microLocation: '',
        model: 'remote-first',
        seats: 0,
        utilisationPct: 100,
        areaPerSeatSqft: 0,
        rentPerSqftMonthly: 0,
        camPerSqftMonthly: 0,
        seatPriceMonthly: 0,
        depositMonths: 0,
        fitoutPerSqft: 0,
        furnitureSetup: 0,
        internetMonthly: 0,
        utilitiesMonthly: 0,
        housekeepingSecurityMonthly: 0,
        transportParkingInsuranceMonthly: 0,
        rentEscalationPct: 0,
        expansions: [],
      },
      roles: [
        {
          id: 'role-dev',
          department: 'Software Engineering',
          title: 'Engineer',
          seniority: 'mid',
          headcount: 10,
          annualGross: 1_200_000,
          costBasis: 'all-inclusive',
          basicSharePct: 50,
          employerPfPct: 12,
          pfWageCapped: false,
          gratuityPct: 0,
          otherStatutoryPct: 0,
          benefitsAnnual: 0,
          shiftAllowanceMonthly: 0,
          incrementPct: null,
          recruitmentFeePct: 0,
          hireMonth: 1,
          rampMonths: 1,
          attritionPct: null,
        },
      ],
      ai: {
        mode: 'usage',
        monthlyBudget: 0,
        budgetCurrency: 'INR',
        subscriptions: [],
        usage: [],
        hardwarePerEmployee: 0,
        hardwareCycleMonths: 36,
      },
      categories: [],
      lines: [],
      assumptions: {
        forecastMonths: 12,
        salaryInflationPct: 0,
        techGrowthPct: 0,
        attritionPct: 0,
        contingencyPct: 0,
        workingCapitalMonths: 0,
        paymentTiming: 'arrears',
        discountRatePct: null,
        pfWageCeilingMonthly: 15_000,
        officeTaxPct: 0,
        technologyTaxPct: 0,
        monthlyBenefit: null,
        operatingPhaseMonth: 12,
      },
    },
  ],
  activeScenarioId: 'standard',
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

export const gccEstimateJson = (overrides: Partial<Estimate> = {}) =>
  JSON.stringify(gccEstimate(overrides));
