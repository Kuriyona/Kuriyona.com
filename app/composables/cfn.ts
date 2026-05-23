export interface CF {
  page: Page;
  components: Component[];
  incidents: any[];
  scheduled_maintenances: ScheduledMaintenance[];
  status: StatusClass;
}

interface Component {
  id: string;
  name: string;
  status: NewStatusEnum;
  created_at: Date;
  updated_at: Date;
  position: number;
  description: null | string;
  showcase: boolean;
  start_date: Date | null;
  group_id: Groupid | null;
  page_id: Id;
  group: boolean;
  only_show_if_degraded: boolean;
  components?: string[];
}

enum Groupid {
  M3639X4Txd08 = 'm3639x4txd08',
  Q6Qm6Fvkst4H = 'q6qm6fvkst4h',
  The00Gpj4S37Mz4 = '00gpj4s37mz4',
  The1Km35Smx8P41 = '1km35smx8p41',
  The4L01Sk5Cdn5C = '4l01sk5cdn5c',
  The77867Vxkttgw = '77867vxkttgw',
  The91Blz4Ztt7Dm = '91blz4ztt7dm',
  Zqxhg7Y54Vy8 = 'zqxhg7y54vy8',
}

enum Id {
  Yh6F0R4529Hb = 'yh6f0r4529hb',
}

enum NewStatusEnum {
  Operational = 'operational',
  PartialOutage = 'partial_outage',
  UnderMaintenance = 'under_maintenance',
}

interface Page {
  id: Id;
  name: string;
  url: string;
  time_zone: string;
  updated_at: Date;
}

interface ScheduledMaintenance {
  id: string;
  name: string;
  status: IncidentUpdateStatus;
  created_at: Date;
  updated_at: Date;
  monitoring_at: null;
  resolved_at: null;
  impact: Impact;
  shortlink: string;
  started_at: Date;
  page_id: Id;
  incident_updates: IncidentUpdate[];
  components: Component[];
  scheduled_for: Date;
  scheduled_until: Date;
}

enum Impact {
  Maintenance = 'maintenance',
}

interface IncidentUpdate {
  id: string;
  status: IncidentUpdateStatus;
  body: string;
  incident_id: string;
  created_at: Date;
  updated_at: Date;
  display_at: Date;
  affected_components: AffectedComponent[];
  deliver_notifications: boolean;
  custom_tweet: null;
  tweet_id: null;
}

interface AffectedComponent {
  code: string;
  name: string;
  old_status: NewStatusEnum;
  new_status: NewStatusEnum;
}

enum IncidentUpdateStatus {
  Scheduled = 'scheduled',
}

interface StatusClass {
  indicator: string;
  description: string;
}
