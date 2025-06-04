export interface DonationsListResult {
  donationsList?: any[];
  error?: string;
}

export function getDonationsList(): Promise<DonationsListResult>;
