import type { BusinessProfile, CatalogItem, ClientRecord } from "../types.js";

export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  name: "InvoiceAI Technologies Pvt Ltd",
  tagline: "Smart Automated Billing & Solutions",
  email: "billing@invoiceai.io",
  phone: "+91 98765 43210",
  address: "Tower B, Cyber City, Sector 24, Gurugram, Haryana 122002, India",
  taxId: "06AAACI1234F1Z8", // GSTIN
  bankDetails: {
    accountName: "InvoiceAI Technologies Pvt Ltd",
    accountNumber: "98765432100012",
    ifscCode: "HDFC0001234",
    bankName: "HDFC Bank Ltd",
    branch: "Cyber City Branch",
  },
  defaultTerms: [
    "Payment is due within the stipulated due date.",
    "Late payments are subject to a 1.5% compounding fee per month.",
    "Please cite the invoice number in all wire payment references.",
  ],
  defaultNotes:
    "Thank you for your business! We appreciate the opportunity to collaborate.",
};

export const MOCK_CLIENTS: ClientRecord[] = [
  {
    id: "client-abc",
    name: "Rajesh Sharma",
    companyName: "ABC Ltd",
    email: "accounts@abcltd.com",
    phone: "+91 98111 22334",
    address:
      "Plot 45, MIDC Industrial Area, Andheri East, Mumbai, Maharashtra 400093",
    taxId: "27AABCA4567M1ZX",
  },
  {
    id: "client-acme",
    name: "John Miller",
    companyName: "Acme Corp",
    email: "finance@acmecorp.com",
    phone: "+1 (555) 234-5678",
    address: "742 Evergreen Terrace, Suite 100, Austin, TX 78701, USA",
    taxId: "US-EIN-98-7654321",
  },
  {
    id: "client-infosys",
    name: "Priya Nair",
    companyName: "Infosys Technologies",
    email: "vendorpayments@infosys.com",
    phone: "+91 80 2852 0261",
    address: "Electronics City, Hosur Road, Bengaluru, Karnataka 560100",
    taxId: "29AAACI1681G1ZM",
  },
  {
    id: "client-techcorp",
    name: "Amitabh Verma",
    companyName: "TechCorp Global Solutions",
    email: "billing@techcorp.in",
    phone: "+91 11 4567 8900",
    address: "Connaught Place, Barakhamba Road, New Delhi, Delhi 110001",
    taxId: "07AAACT9876E1Z2",
  },
  {
    id: "client-zenith",
    name: "Sarah Jenkins",
    companyName: "Zenith Digital Media",
    email: "invoices@zenithdigital.com",
    phone: "+44 20 7946 0958",
    address: "100 Bishopsgate, London EC2N 4AG, United Kingdom",
    taxId: "GB-VAT-123456789",
  },
];

export const MOCK_CATALOG: CatalogItem[] = [
  {
    id: "cat-logo",
    name: "Logo Design & Brand Identity",
    keywords: [
      "logo",
      "logo design",
      "brand",
      "branding",
      "identity",
      "vector logo",
    ],
    description:
      "Full brand logo design package with source vector files, mockups, and guidelines.",
    unitPrice: 5000,
    unit: "design",
    defaultTaxRate: 18,
    hsnSacCode: "998314",
  },
  {
    id: "cat-web-dev",
    name: "Website Development & Engineering",
    keywords: [
      "website",
      "web development",
      "web dev",
      "website development",
      "frontend",
      "webapp",
    ],
    description:
      "Custom responsive web application design, frontend implementation and testing.",
    unitPrice: 25000,
    unit: "service",
    defaultTaxRate: 18,
    hsnSacCode: "998313",
  },
  {
    id: "cat-seo-audit",
    name: "Comprehensive SEO & Performance Audit",
    keywords: [
      "seo",
      "seo audit",
      "audit",
      "search optimization",
      "performance audit",
    ],
    description:
      "Technical search engine optimization audit, Core Web Vitals profiling and report.",
    unitPrice: 12000,
    unit: "report",
    defaultTaxRate: 18,
    hsnSacCode: "998315",
  },
  {
    id: "cat-cloud-consulting",
    name: "Cloud Architecture & DevOps Consulting",
    keywords: [
      "cloud",
      "devops",
      "aws",
      "gcp",
      "consulting",
      "infrastructure",
      "server setup",
    ],
    description:
      "Hourly cloud infrastructure optimization, CI/CD pipeline automation and deployment.",
    unitPrice: 4500,
    unit: "hour",
    defaultTaxRate: 18,
    hsnSacCode: "998316",
  },
  {
    id: "cat-ui-ux",
    name: "UI/UX Product Design (Figma)",
    keywords: [
      "ui",
      "ux",
      "ui/ux",
      "figma",
      "product design",
      "wireframes",
      "prototyping",
    ],
    description:
      "High-fidelity interactive UI screens, design system components and user flow testing.",
    unitPrice: 18000,
    unit: "project",
    defaultTaxRate: 18,
    hsnSacCode: "998314",
  },
  {
    id: "cat-maintenance",
    name: "Monthly Software Maintenance & Support",
    keywords: [
      "maintenance",
      "support",
      "monthly retainer",
      "bug fixes",
      "service contract",
    ],
    description:
      "Ongoing monthly bug fixing, security patch updates, and system health monitoring.",
    unitPrice: 15000,
    unit: "month",
    defaultTaxRate: 18,
    hsnSacCode: "998319",
  },
];
