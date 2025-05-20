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

// Employee name mapping
export const EMPLOYEE_NAMES: Record<string, string> = {
  "antonio": "Antonio Martinez",
  "arturo": "Arturo Sanchez",
  "brandon": "Brandon Blond",
  "brett": "Brett Willson",
  "dave": "Dave Roehm",
  "devin": "Devin Bean",
  "dylan": "Dylan McMullen",
  "elijah": "Elijah Aguilar",
  "ethan": "Ethan Walker",
  "gabe": "Gabe Ott",
  "jacob": "Jacob Weldon",
  "joe": "Joe Albright",
  "jonathan": "Jonathan Zaccheo",
  "kevin": "Kevin Hanrahan",
  "melvin": "Melvin Lobos",
  "noe": "Noe Coronado",
  "riley": "Riley McIntyre",
  "ryan": "Ryan Hocevar",
  "zane": "Zane Springer"
};

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
  notes: ""
};
