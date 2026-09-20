/** What arranging cover asks for. */
export interface DelegateApprovalsValues {
  toEmployeeId: string;
  fromDate: string;
  toDate: string;
  note: string;
}

export interface DelegateApprovalsFormProps {
  onDone: () => void;
  onCancel: () => void;
}
