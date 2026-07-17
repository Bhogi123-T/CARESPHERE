export const mockGovMetrics = {
  totalEmergencies: 12450,
  activeHealthCamps: 34,
  avgResponseTime: "12 mins",
  criticalCases: 892,
  outbreakData: [
    { month: "Jan", dengue: 45, malaria: 20, snakebites: 15 },
    { month: "Feb", dengue: 30, malaria: 25, snakebites: 20 },
    { month: "Mar", dengue: 25, malaria: 30, snakebites: 35 },
    { month: "Apr", dengue: 15, malaria: 40, snakebites: 50 },
    { month: "May", dengue: 10, malaria: 45, snakebites: 80 },
    { month: "Jun", dengue: 60, malaria: 80, snakebites: 120 }, // Monsoon spike
  ],
  regionalAlerts: [
    { id: 1, region: "Adilabad Rural", alert: "Malaria Spike Detected", severity: "HIGH" },
    { id: 2, region: "Khammam", alert: "Anti-venom shortage", severity: "CRITICAL" },
    { id: 3, region: "Warangal", alert: "Health camp successfully deployed", severity: "LOW" },
  ]
};

export const mockMapData = {
  hospitals: [
    { id: 'h1', name: 'Rural Health Center Alpha', lat: 17.4050, lng: 78.4967, bedsAvailable: 12 },
    { id: 'h2', name: 'District General Hospital', lat: 17.3700, lng: 78.4700, bedsAvailable: 45 },
    { id: 'h3', name: 'Community Clinic Beta', lat: 17.3900, lng: 78.5100, bedsAvailable: 3 },
  ],
  ambulances: [
    { id: 'a1', name: 'Ambulance 104-A', lat: 17.3800, lng: 78.4800, status: 'DISPATCHED' },
    { id: 'a2', name: 'Ambulance 108-B', lat: 17.4100, lng: 78.4600, status: 'AVAILABLE' },
    { id: 'a3', name: 'Ambulance 108-C', lat: 17.3600, lng: 78.4900, status: 'DISPATCHED' },
  ]
};

export const mockPharmacyInventory = [
  { id: 1, name: "Polyvalent Anti-snake Venom", category: "Emergency", stock: 15, status: "LOW" },
  { id: 2, name: "Human Mixtard Insulin", category: "Chronic", stock: 120, status: "OPTIMAL" },
  { id: 3, name: "Amoxicillin 500mg", category: "Antibiotic", stock: 500, status: "OPTIMAL" },
  { id: 4, name: "Paracetamol IV", category: "Analgesic", stock: 0, status: "OUT_OF_STOCK" },
  { id: 5, name: "Tetanus Toxoid Vaccine", category: "Vaccine", stock: 45, status: "MODERATE" },
];

export const mockVolunteerTasks = [
  { id: 1, title: "Medicine Delivery", location: "Village Ramapur", distance: "4.5 km", urgency: "HIGH", description: "Deliver Insulin pack to elderly patient." },
  { id: 2, title: "Health Camp Assistance", location: "Community Hall, Medak", distance: "12 km", urgency: "MEDIUM", description: "Assist doctors with patient registration." },
  { id: 3, title: "Blood Donation Drive", location: "District Center", distance: "8 km", urgency: "LOW", description: "Help distribute snacks and manage queues." },
];
