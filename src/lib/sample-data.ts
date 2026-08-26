/**
 * Placeholder rows so the ported screens can be reviewed before CRMBackend has
 * the matching routes. Every page prefers live data and only falls back here
 * when the request fails; delete this module once the endpoints exist.
 */

import type { Client } from "@/lib/clients";
import type { DwRequest } from "@/lib/working-dw";

export const SAMPLE_CLIENTS: Client[] = [
  {
    id: "1",
    username: "testsai",
    balance: 1000,
    exposure: 0,
    category: "D1",
    sharingTree: "15 -> 0 -> 0 -> 0 -> 15",
    totalDeposits: 1000,
    totalWithdrawals: 0,
    betCount: 0,
    winningPercent: 0,
    lifetimePnl: 0,
    createdAt: "2026-06-02T10:00:00Z",
    isActive: true,
    parents: [
      { id: "p1", username: "testsunny656", role: "MASTER", sharingRatio: 0 },
      { id: "p2", username: "testsunny246", role: "SUPER", sharingRatio: 0 },
      { id: "p3", username: "sunnydl", role: "DL", sharingRatio: 0 },
      { id: "p4", username: "BalaJi", role: "ADMIN", sharingRatio: 15 },
    ],
    transactions: [
      {
        id: "t1",
        createdAt: "2026-06-02T10:04:00Z",
        type: "DEPOSIT",
        amount: 1000,
        paymentMode: "BANK_TRANSFER",
        utrNumber: "331768763365",
        partyPrefix: "From",
        partyUsername: "sunnydl",
        partyRole: "DL",
      },
      {
        id: "t2",
        createdAt: "2026-06-04T18:22:00Z",
        type: "WITHDRAWAL",
        amount: 250,
        paymentMode: "UPI",
        utrNumber: "884512099317",
        partyPrefix: "To",
        partyUsername: "sunnydl",
        partyRole: "DL",
      },
      {
        id: "t3",
        createdAt: "2026-06-09T09:41:00Z",
        type: "BONUS",
        amount: 100,
        paymentMode: null,
        utrNumber: null,
        partyPrefix: "From",
        partyUsername: "BalaJi",
        partyRole: "ADMIN",
      },
    ],
  },
  { id: "2", username: "dummyrootuser", balance: 8900, category: "D1", isActive: true },
  { id: "3", username: "saii", balance: 9983, category: "D1", isActive: true },
  { id: "4", username: "rootuser", balance: 200, category: "D1", isActive: true },
  { id: "5", username: "kaushal557", balance: 0, category: "D1", isActive: true },
  { id: "6", username: "satishtest", balance: 9700, category: "D1", isActive: true },
  { id: "7", username: "kaushal585", balance: 9700, category: "D1", isActive: true },
  { id: "8", username: "saitestDummy", balance: 5000, category: "D1", isActive: true },
  { id: "9", username: "saitest", balance: 0, category: "D1", isActive: true },
  { id: "10", username: "malay", balance: 15436, category: "D1", isActive: true },
  { id: "11", username: "usertester245", balance: 0, category: "D1", isActive: true },
];

const dwRow = (
  id: string,
  overrides: Partial<DwRequest> = {},
): DwRequest => ({
  id,
  username: "saitest419",
  master: "testmaster",
  platform: "Sikander Exchange",
  category: "D1",
  sourceType: "SELF",
  amount: 500,
  bonusEligible: false,
  paymentMode: null,
  utrNumber: "331768763365",
  createdAt: "2026-08-20T09:12:00Z",
  requestedBy: "saitest419",
  status: "PENDING",
  isDummyRequest: false,
  ...overrides,
});

export const SAMPLE_DW_REQUESTS: DwRequest[] = [
  dwRow("a1", {
    username: "saii",
    assignedToUserName: "rajamatha_tm",
    assignedToUserId: "other",
    utrNumber: "657854",
  }),
  dwRow("a2", { amount: 200, utrNumber: "6464" }),
  dwRow("a3", { amount: 5000, sourceType: "MANUAL", utrNumber: "6486" }),
  dwRow("a4", { amount: 300, utrNumber: "12345678987654" }),
  dwRow("a5", { amount: 500, utrNumber: "331768763365" }),
  dwRow("a6", { amount: 1000, utrNumber: "3317687633567" }),
  dwRow("a7", { amount: 4000, utrNumber: "3317687633456" }),
  dwRow("a8", { amount: 2000, utrNumber: "331768763322" }),
  dwRow("a9", { amount: 2000, utrNumber: "331768763362" }),
  dwRow("a10", { amount: 1500, utrNumber: "331768763301" }),
  dwRow("a11", { amount: 750, utrNumber: "331768763288" }),
];
