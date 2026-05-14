export interface Account {
  id: string;
  email: string;
  name: string | null;
}

export interface Label {
  id: number;
  account_id: string;
  name: string;
  color: string;
  created_at: number;
}

export interface LabelRule {
  id: number;
  label_id: number;
  pattern: string;
  created_at: number;
}
