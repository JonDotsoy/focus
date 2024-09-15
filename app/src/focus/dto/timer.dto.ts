export interface TimerDTO {
  id: string;
  title: string;
  start_at: number;
  end_at: number | null;
  notes: string | null;
}
