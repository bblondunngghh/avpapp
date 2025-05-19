// Location-related constants
export const LOCATIONS = [
  { id: 1, name: "The Capital Grille" },
  { id: 2, name: "Bob's Steak and Chop House" },
  { id: 3, name: "Truluck's" },
  { id: 4, name: "BOA Steakhouse" }
];

export const LOCATION_ID_MAP: Record<string, number> = {
  "The Capital Grille": 1,
  "Bob's Steak and Chop House": 2,
  "Truluck's": 3,
  "BOA Steakhouse": 4
};

// Shift options
export const SHIFT_OPTIONS = [
  { value: "Lunch", label: "Lunch" },
  { value: "Dinner", label: "Dinner" }
];

// Form-related constant
export const DEFAULT_FORM_VALUES = {
  date: "",
  shift: "",
  manager: "",
  attendants: 1,
  totalCars: 0,
  totalRevenue: 0,
  complimentaryCars: 0,
  cashPayments: 0,
  creditPayments: 0,
  notes: "",
  incidents: ""
};
