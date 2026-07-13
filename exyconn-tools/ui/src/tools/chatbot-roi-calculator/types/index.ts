export interface ROIInputs {
  costPerHour: number;
  ticketsPerMonth: number;
  resolutionTimeMinutes: number;
  automationPercentage: number;
}

export interface ROIResults {
  totalSavings: number;
  hoursSaved: number;
  smartExyBotCost: number;
  annualROI: number;
}
