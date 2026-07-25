const adminMetrics = {
  totalResidents: 1248,
  occupancyRate: 92,
  pendingMaintenance: 14,
  resolvedThisMonth: 45,
  totalRevenue: 284500,
  monthlyTarget: 300000,
  unpaidInvoices: 32,
  unpaidAmount: 18400,
};

const revenueByMonth = [
  { month: "Nov", amount: 265000 },
  { month: "Dec", amount: 272000 },
  { month: "Jan", amount: 268000 },
  { month: "Feb", amount: 278000 },
  { month: "Mar", amount: 282000 },
  { month: "Apr", amount: 284500 },
];

const occupancyData = [
  { label: "Occupied", value: 92, color: "var(--c-success-light)" },
  { label: "Vacant", value: 6, color: "var(--c-accent-light)" },
  { label: "Maintenance", value: 2, color: "var(--c-danger-light)" },
];

const recentActivity = [
  {
    id: 1,
    type: "payment",
    description: "Rent Payment - Unit 4B",
    resident: "Sarah Mitchell",
    amount: "$2,700",
    time: "10 mins ago",
    status: "completed",
  },
  {
    id: 2,
    type: "maintenance",
    description: "HVAC Repair Request",
    resident: "Michael Chang",
    amount: null,
    time: "1 hour ago",
    status: "pending",
  },
  {
    id: 3,
    type: "system",
    description: "Lease Renewal Signed",
    resident: "Emma Watson",
    amount: null,
    time: "3 hours ago",
    status: "completed",
  },
  {
    id: 4,
    type: "payment",
    description: "Late Fee Applied",
    resident: "David Miller",
    amount: "$50",
    time: "5 hours ago",
    status: "warning",
  },
  {
    id: 5,
    type: "maintenance",
    description: "Plumbing Fixed - Unit 12A",
    resident: "James Wilson",
    amount: null,
    time: "Yesterday",
    status: "completed",
  },
];

const maintenanceRequests = [
  {
    id: "MR-2038",
    unit: "Apt 4B",
    category: "Plumbing",
    description: "Leaking sink in the master bathroom",
    priority: "High",
    status: "Pending",
  },
  {
    id: "MR-2039",
    unit: "Apt 12A",
    category: "HVAC",
    description: "AC not cooling properly",
    priority: "Medium",
    status: "In Progress",
  },
  {
    id: "MR-2040",
    unit: "Apt 7C",
    category: "Electrical",
    description: "Outlet in kitchen not working",
    priority: "Low",
    status: "Resolved",
  },
  {
    id: "MR-2041",
    unit: "Apt 2B",
    category: "Appliance",
    description: "Refrigerator making loud noise",
    priority: "Medium",
    status: "Pending",
  },
];

const residentInvoice = {
  invoiceId: "INV-2026-04",
  dueDate: "April 5, 2026",
  previousBalance: 0,
  items: [
    { label: "Base Rent (Unit 4B)", amount: 2500 },
    { label: "Parking Fee (Spot #42)", amount: 150 },
    { label: "Trash & Utilities", amount: 50 },
  ],
};

const paymentHistory = [
  {
    id: 1,
    period: "March 2026",
    amount: 2700,
    date: "Mar 3, 2026",
    method: "Visa .... 4829",
    status: "Paid",
  },
  {
    id: 2,
    period: "February 2026",
    amount: 2700,
    date: "Feb 2, 2026",
    method: "Visa .... 4829",
    status: "Paid",
  },
  {
    id: 3,
    period: "January 2026",
    amount: 2700,
    date: "Jan 4, 2026",
    method: "Visa .... 4829",
    status: "Paid",
  },
];
