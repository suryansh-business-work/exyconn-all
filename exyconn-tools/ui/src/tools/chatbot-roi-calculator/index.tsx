import React, { useState, useMemo } from 'react';
import { Container } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Calculate } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import ROICalculator from './components/ROICalculator';
import ROIResults from './components/ROIResults';
import { ROIInputs, ROIResults as ROIResultsType } from './types';

// Default values based on the reference
const DEFAULT_INPUTS: ROIInputs = {
  costPerHour: 14,
  ticketsPerMonth: 103,
  resolutionTimeMinutes: 109,
  automationPercentage: 14,
};

// Smart Exy Bot annual cost (similar to SiteGPT pricing)
const SMART_EXY_BOT_ANNUAL_COST = 948;

const calculateROI = (inputs: ROIInputs): ROIResultsType => {
  const { costPerHour, ticketsPerMonth, resolutionTimeMinutes, automationPercentage } = inputs;

  // Calculate annual values
  const ticketsPerYear = ticketsPerMonth * 12;
  const automatedTicketsPerYear = ticketsPerYear * (automationPercentage / 100);

  // Hours saved per year
  const hoursPerTicket = resolutionTimeMinutes / 60;
  const hoursSaved = automatedTicketsPerYear * hoursPerTicket;

  // Cost savings per year
  const totalSavings = hoursSaved * costPerHour;

  // Net savings after Smart Exy Bot cost
  const netSavings = totalSavings - SMART_EXY_BOT_ANNUAL_COST;

  // ROI calculation: (Net Profit / Cost) * 100
  const annualROI = SMART_EXY_BOT_ANNUAL_COST > 0 ? Math.round((netSavings / SMART_EXY_BOT_ANNUAL_COST) * 100) : 0;

  return {
    totalSavings: Math.round(totalSavings * 100) / 100,
    hoursSaved: Math.round(hoursSaved * 1000) / 1000,
    smartExyBotCost: SMART_EXY_BOT_ANNUAL_COST,
    annualROI,
  };
};

const ChatbotROICalculator: React.FC = () => {
  const [inputs, setInputs] = useState<ROIInputs>(DEFAULT_INPUTS);

  const results = useMemo(() => calculateROI(inputs), [inputs]);

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
  };

  return (
    <ToolLayout toolName="Chatbot ROI Calculator" toolIcon={<Calculate />} toolColor="#0ea5e9">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Left Panel - Calculator Inputs */}
          <Grid size={{ xs: 12, md: 6 }}>
            <ROICalculator inputs={inputs} onChange={setInputs} onReset={handleReset} />
          </Grid>

          {/* Right Panel - Results */}
          <Grid size={{ xs: 12, md: 6 }}>
            <ROIResults results={results} />
          </Grid>
        </Grid>
      </Container>
    </ToolLayout>
  );
};

export default ChatbotROICalculator;
