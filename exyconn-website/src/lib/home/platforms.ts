/**
 * "Platforms We Build On and Integrate" — the two-row logo slider on the home stage.
 *
 * These are platforms Exyconn builds on and connects client systems to, not partnerships:
 * the heading says so, and the marks are plain brand logos, never a vendor's partner badge.
 * Each row scrolls on its own, the second against the first.
 */
export interface PlatformLogo {
  name: string;
  src: string;
}

export const platformsCopy = {
  title: "Platforms We Build On and Integrate",
  lead: "The clouds, AI models, data platforms and business systems our agents and automations run on — and connect your stack to.",
} as const;

const logo = (name: string, file: string): PlatformLogo => ({
  name,
  src: `/logos/platforms/${file}.svg`,
});

export const platformRows: readonly (readonly PlatformLogo[])[] = [
  [
    logo("Amazon Web Services", "aws"),
    logo("Ingram Micro", "ingram-micro"),
    logo("Claude", "claude"),
    logo("Google Cloud Platform", "google-cloud"),
    logo("Azure", "azure"),
    logo("ServiceNow", "servicenow"),
    logo("Adobe", "adobe"),
    logo("Magento", "magento"),
    logo("Databricks", "databricks"),
    logo("Snowflake", "snowflake"),
    logo("HubSpot", "hubspot"),
    logo("Moengage", "moengage"),
    logo("Boomi", "boomi"),
    logo("Docker", "docker"),
  ],
  [
    logo("OpenAI", "openai"),
    logo("AWS Bedrock", "aws-bedrock"),
    logo("MuleSoft", "mulesoft"),
    logo("OneStream", "onestream"),
    logo("Oracle", "oracle"),
    logo("Salesforce", "salesforce"),
    logo("Red Hat", "red-hat"),
    logo("Sabre", "sabre"),
    logo("Stripe", "stripe"),
    logo("Cloudinary", "cloudinary"),
  ],
];
