import { z } from "zod"

// Enums
export const CityEnum = z.enum(["Chandigarh", "Mohali", "Zirakpur", "Panchkula", "Other"])
export const PropertyTypeEnum = z.enum(["Apartment", "Villa", "Plot", "Office", "Retail"])
export const BHKEnum = z.enum(["1", "2", "3", "4", "Studio"])
export const PurposeEnum = z.enum(["Buy", "Rent"])
export const TimelineEnum = z.enum(["0-3m", "3-6m", ">6m", "Exploring"])
export const SourceEnum = z.enum(["Website", "Referral", "Walk-in", "Call", "Other"])
export const StatusEnum = z.enum(["New", "Qualified", "Contacted", "Visited", "Negotiation", "Converted", "Dropped"])

// Phone validation (10-15 digits)
const phoneSchema = z.string().regex(/^\d{10,15}$/, "Phone must be 10-15 digits")

// Main buyer schema
export const buyerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(80, "Full name must be less than 80 characters"),
    email: z.string().email("Invalid email format").optional().or(z.literal("")),
    phone: phoneSchema,
    city: CityEnum,
    propertyType: PropertyTypeEnum,
    bhk: BHKEnum.optional(),
    purpose: PurposeEnum,
    budgetMin: z.number().int().min(0).optional(),
    budgetMax: z.number().int().min(0).optional(),
    timeline: TimelineEnum,
    source: SourceEnum,
    status: StatusEnum.default("New"),
    notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
    tags: z.array(z.string()).optional().default([]),
  })
  .refine(
    (data) => {
      // BHK required for Apartment and Villa
      if (["Apartment", "Villa"].includes(data.propertyType) && !data.bhk) {
        return false
      }
      return true
    },
    {
      message: "BHK is required for Apartment and Villa property types",
      path: ["bhk"],
    },
  )
  .refine(
    (data) => {
      // Budget validation
      if (data.budgetMin && data.budgetMax) {
        return data.budgetMax >= data.budgetMin
      }
      return true
    },
    {
      message: "Budget max must be greater than or equal to budget min",
      path: ["budgetMax"],
    },
  )

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
})

// Types
export type Buyer = z.infer<typeof buyerSchema>
export type City = z.infer<typeof CityEnum>
export type PropertyType = z.infer<typeof PropertyTypeEnum>
export type BHK = z.infer<typeof BHKEnum>
export type Purpose = z.infer<typeof PurposeEnum>
export type Timeline = z.infer<typeof TimelineEnum>
export type Source = z.infer<typeof SourceEnum>
export type Status = z.infer<typeof StatusEnum>
