/** What an administrator fills in to push an announcement to tracked desktops. */
export interface TrackerNoticeFormValues {
  title: string;
  body: string;
  /** Empty reaches every employee with an active tracker grant. */
  userIds: string[];
}
