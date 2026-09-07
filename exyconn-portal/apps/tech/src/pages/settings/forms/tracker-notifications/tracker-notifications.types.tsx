/** Form values for choosing where finished tracker builds and status alerts are posted. */
export interface TrackerNotificationsFormValues {
  slackChannels: string[];
  /** Channels told when a status incident opens or resolves. */
  statusAlertChannels: string[];
}
