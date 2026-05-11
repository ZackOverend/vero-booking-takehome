import type { BookingStatus, TriageLevel } from "@/lib/db/schema";

export function statusStyles(status: BookingStatus): string {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "confirmed":
      return "bg-green-50 text-green-700 border-green-200";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";
  }
}

export function triageStyles(level: TriageLevel): string {
  switch (level) {
    case "urgent":
      return "bg-red-50 text-red-700 border-red-200";
    case "soon":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "routine":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "administrative":
      return "bg-gray-50 text-gray-600 border-gray-200";
    case "safety_flag":
      return "bg-red-100 text-red-800 border-red-300";
  }
}

export function triageBorder(level: TriageLevel): string {
  switch (level) {
    case "urgent":
      return "bg-red-500";
    case "soon":
      return "bg-orange-400";
    case "routine":
      return "bg-blue-400";
    case "administrative":
      return "bg-gray-300";
    case "safety_flag":
      return "bg-red-700";
  }
}

export function triageLabel(level: TriageLevel): string {
  switch (level) {
    case "urgent":
      return "Urgent";
    case "soon":
      return "Soon";
    case "routine":
      return "Routine";
    case "administrative":
      return "Admin";
    case "safety_flag":
      return "Safety flag";
  }
}
