import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const merchants = pgTable("merchants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  storeTimings: jsonb("store_timings").$type<{
    weekdays: { open: string; close: string };
    weekends: { open: string; close: string };
  }>(),
  deliverySettings: jsonb("delivery_settings").$type<{
    radius: number;
    minimumOrder: number;
    fee: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const platforms = pgTable("platforms", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").references(() => merchants.id),
  name: text("name").notNull(), // swiggy, zomato, magicpin
  isConnected: boolean("is_connected").default(false),
  credentials: jsonb("credentials").$type<{
    username?: string;
    encryptedPassword?: string;
    apiKey?: string;
  }>(),
  lastSync: timestamp("last_sync"),
  status: text("status").default("disconnected"), // connected, disconnected, error
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").references(() => merchants.id),
  title: text("title").notNull(),
  description: text("description"),
  discountType: text("discount_type").notNull(), // percentage, fixed, bogo
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }),
  minimumOrder: decimal("minimum_order", { precision: 10, scale: 2 }),
  platforms: jsonb("platforms").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").references(() => merchants.id),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // seasonal, flash, repeat, competitor
  status: text("status").default("draft"), // draft, scheduled, running, completed, cancelled
  platforms: jsonb("platforms").$type<string[]>().default([]),
  settings: jsonb("settings").$type<{
    discountType?: string;
    discountValue?: number;
    timeSlots?: string[];
    targetAudience?: string;
  }>(),
  metrics: jsonb("metrics").$type<{
    orders?: number;
    revenue?: number;
    clicks?: number;
    conversions?: number;
  }>(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").references(() => merchants.id),
  date: timestamp("date").notNull(),
  platform: text("platform"), // swiggy, zomato, magicpin, all
  revenue: decimal("revenue", { precision: 12, scale: 2 }).default("0"),
  orders: integer("orders").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviews: integer("reviews").default(0),
  metrics: jsonb("metrics").$type<{
    avgOrderValue?: number;
    customerSatisfaction?: number;
    deliveryTime?: number;
    cancellationRate?: number;
  }>(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").references(() => merchants.id),
  context: text("context").notNull(), // offers, promotions, settings, analytics
  messages: jsonb("messages").$type<Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertMerchantSchema = createInsertSchema(merchants).omit({
  id: true,
  createdAt: true,
});

export const insertPlatformSchema = createInsertSchema(platforms).omit({
  id: true,
  lastSync: true,
});

export const insertOfferSchema = createInsertSchema(offers).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Merchant = typeof merchants.$inferSelect;
export type InsertMerchant = z.infer<typeof insertMerchantSchema>;
export type Platform = typeof platforms.$inferSelect;
export type InsertPlatform = z.infer<typeof insertPlatformSchema>;
export type Offer = typeof offers.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
