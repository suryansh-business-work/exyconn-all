/**
 * Defaults of the GCC-in-India sections: the establishment-model comparison and the
 * setup / recurring / deposit diagram of the cost guide. Every page that places them seeds
 * its own props (exyconn-portal/server/src/modules/cms/seed/exyconn/pages/gcc-*.ts).
 */

export const GCC_TABLE_PROPS = {
  caption: 'How the four establishment models compare',
  columns: ['Factor', 'Captive', 'Managed GCC', 'Build-operate-transfer', 'Hybrid'],
  rows: [
    {
      label: 'Control',
      cells: [
        'Full and direct from day one',
        'Shared: you direct the work, the partner runs the entity and operations',
        'Grows over time; full at transfer',
        'Full over core functions, shared over the rest',
      ],
    },
    {
      label: 'Speed to launch',
      cells: [
        'Slowest: entity, office and leadership hires come first',
        "Fastest: work starts inside the partner's entity and facilities",
        'Fast start, with the transfer planned from the outset',
        'Depends on which functions you set up yourself',
      ],
    },
    {
      label: 'Upfront investment',
      cells: [
        'Highest: you fund setup, fit-out and leadership before delivery starts',
        'Lowest upfront; partner fees sit in the recurring costs',
        'Moderate upfront, plus transfer costs agreed in advance',
        'In between, depending on the split',
      ],
    },
    {
      label: 'Operational burden on you',
      cells: [
        'All of it: HR, payroll, compliance, facilities and vendors',
        'Light: the partner carries day-to-day operations',
        'Light at first, rising as you prepare to take over',
        'Moderate: you run core functions, partners the rest',
      ],
    },
    {
      label: 'Transfer or exit',
      cells: [
        'No transfer; exit means winding down or selling the entity',
        'Contract terms govern notice and the transfer of people and assets',
        'Transfer of entity, people and assets is part of the design',
        'Per function, as agreed with each partner',
      ],
    },
    {
      label: 'Best for',
      cells: [
        'Large, long-term centres holding core IP, run by a team ready to operate in India',
        'Proving the India case quickly, or teams that prefer an operating partner',
        'Owning the centre eventually while sharing the launch risk',
        'Keeping core IP in-house while partnering for support functions',
      ],
    },
  ],
  note: 'No model is always cheaper. Total cost depends on scale, duration, partner fees and how much you run yourself — model each one in the calculator before deciding.',
};

export const GCC_COST_FLOW_PROPS = {
  caption: 'Where every rupee of a GCC budget sits',
  lanes: [
    {
      label: 'One-time',
      held: false,
      title: 'Setup costs',
      text: 'Paid once, mostly before or at launch.',
      items: [
        'Entity incorporation and registrations',
        'Office fit-out, furniture and network',
        'Hardware for every new position',
        'Recruitment fees for the first hires',
        'Entry advisory: legal, tax and FEMA',
        'Security tooling setup fees',
      ],
    },
    {
      label: 'Recurring',
      held: false,
      title: 'Operating expenses',
      text: 'Paid every month, quarter or year for as long as the centre runs.',
      items: [
        'Salaries, statutory contributions and gratuity provision',
        'Rent or seat charges, building charges and utilities',
        'Cloud, AI usage, subscriptions and licences',
        'Accounting, payroll, audit and compliance retainers',
        'Facility services, travel and insurance',
        'Attrition backfill and hardware replacement',
      ],
    },
    {
      label: 'Refundable',
      held: true,
      title: 'Deposits',
      text: 'Cash paid out but returned when the lease ends — part of the cash you need on day one, not a cost.',
      items: [
        'Office security deposit, in months of rent or seat charges',
        'Other deposits a landlord or utility may ask for',
      ],
    },
  ],
  note: 'The calculator keeps the three apart: cost totals exclude deposits, and the initial cash requirement adds them back.',
};
