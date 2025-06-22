import { 
  merchants, platforms, offers, campaigns, analytics, conversations,
  type Merchant, type InsertMerchant,
  type Platform, type InsertPlatform,
  type Offer, type InsertOffer,
  type Campaign, type InsertCampaign,
  type Analytics, type InsertAnalytics,
  type Conversation, type InsertConversation
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  // Merchants
  getMerchant(id: number): Promise<Merchant | undefined>;
  getMerchantByEmail(email: string): Promise<Merchant | undefined>;
  createMerchant(merchant: InsertMerchant): Promise<Merchant>;
  updateMerchant(id: number, updates: Partial<InsertMerchant>): Promise<Merchant | undefined>;

  // Platforms
  getPlatformsByMerchant(merchantId: number): Promise<Platform[]>;
  getPlatform(merchantId: number, platformName: string): Promise<Platform | undefined>;
  createPlatform(platform: InsertPlatform): Promise<Platform>;
  updatePlatform(id: number, updates: Partial<InsertPlatform>): Promise<Platform | undefined>;

  // Offers
  getOffersByMerchant(merchantId: number): Promise<Offer[]>;
  getActiveOffers(merchantId: number): Promise<Offer[]>;
  createOffer(offer: InsertOffer): Promise<Offer>;
  updateOffer(id: number, updates: Partial<InsertOffer>): Promise<Offer | undefined>;
  deleteOffer(id: number): Promise<boolean>;

  // Campaigns
  getCampaignsByMerchant(merchantId: number): Promise<Campaign[]>;
  getActiveCampaigns(merchantId: number): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, updates: Partial<InsertCampaign>): Promise<Campaign | undefined>;

  // Analytics
  getAnalyticsByMerchant(merchantId: number, days?: number): Promise<Analytics[]>;
  getAnalyticsByPlatform(merchantId: number, platform: string, days?: number): Promise<Analytics[]>;
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;

  // Conversations
  getConversation(merchantId: number, context: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, updates: Partial<InsertConversation>): Promise<Conversation | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Merchants
  async getMerchant(id: number): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.id, id));
    return merchant || undefined;
  }

  async getMerchantByEmail(email: string): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.email, email));
    return merchant || undefined;
  }

  async createMerchant(insertMerchant: InsertMerchant): Promise<Merchant> {
    const [merchant] = await db
      .insert(merchants)
      .values(insertMerchant)
      .returning();
    return merchant;
  }

  async updateMerchant(id: number, updates: Partial<InsertMerchant>): Promise<Merchant | undefined> {
    const [merchant] = await db
      .update(merchants)
      .set(updates)
      .where(eq(merchants.id, id))
      .returning();
    return merchant || undefined;
  }

  // Platforms
  async getPlatformsByMerchant(merchantId: number): Promise<Platform[]> {
    return await db.select().from(platforms).where(eq(platforms.merchantId, merchantId));
  }

  async getPlatform(merchantId: number, platformName: string): Promise<Platform | undefined> {
    const [platform] = await db
      .select()
      .from(platforms)
      .where(and(eq(platforms.merchantId, merchantId), eq(platforms.name, platformName)));
    return platform || undefined;
  }

  async createPlatform(insertPlatform: InsertPlatform): Promise<Platform> {
    const [platform] = await db
      .insert(platforms)
      .values(insertPlatform)
      .returning();
    return platform;
  }

  async updatePlatform(id: number, updates: Partial<InsertPlatform>): Promise<Platform | undefined> {
    const [platform] = await db
      .update(platforms)
      .set(updates)
      .where(eq(platforms.id, id))
      .returning();
    return platform || undefined;
  }

  // Offers
  async getOffersByMerchant(merchantId: number): Promise<Offer[]> {
    return await db.select().from(offers).where(eq(offers.merchantId, merchantId));
  }

  async getActiveOffers(merchantId: number): Promise<Offer[]> {
    return await db
      .select()
      .from(offers)
      .where(and(eq(offers.merchantId, merchantId), eq(offers.isActive, true)));
  }

  async createOffer(insertOffer: InsertOffer): Promise<Offer> {
    const [offer] = await db
      .insert(offers)
      .values(insertOffer)
      .returning();
    return offer;
  }

  async updateOffer(id: number, updates: Partial<InsertOffer>): Promise<Offer | undefined> {
    const [offer] = await db
      .update(offers)
      .set(updates)
      .where(eq(offers.id, id))
      .returning();
    return offer || undefined;
  }

  async deleteOffer(id: number): Promise<boolean> {
    const result = await db.delete(offers).where(eq(offers.id, id));
    return result.rowCount > 0;
  }

  // Campaigns
  async getCampaignsByMerchant(merchantId: number): Promise<Campaign[]> {
    return await db.select().from(campaigns).where(eq(campaigns.merchantId, merchantId));
  }

  async getActiveCampaigns(merchantId: number): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.merchantId, merchantId), eq(campaigns.status, "active")));
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db
      .insert(campaigns)
      .values(insertCampaign)
      .returning();
    return campaign;
  }

  async updateCampaign(id: number, updates: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const [campaign] = await db
      .update(campaigns)
      .set(updates)
      .where(eq(campaigns.id, id))
      .returning();
    return campaign || undefined;
  }

  // Analytics
  async getAnalyticsByMerchant(merchantId: number, days: number = 7): Promise<Analytics[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await db
      .select()
      .from(analytics)
      .where(and(eq(analytics.merchantId, merchantId), gte(analytics.date, cutoffDate)))
      .orderBy(desc(analytics.date));
  }

  async getAnalyticsByPlatform(merchantId: number, platform: string, days: number = 7): Promise<Analytics[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await db
      .select()
      .from(analytics)
      .where(
        and(
          eq(analytics.merchantId, merchantId),
          eq(analytics.platform, platform),
          gte(analytics.date, cutoffDate)
        )
      )
      .orderBy(desc(analytics.date));
  }

  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const [analytic] = await db
      .insert(analytics)
      .values(insertAnalytics)
      .returning();
    return analytic;
  }

  // Conversations
  async getConversation(merchantId: number, context: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.merchantId, merchantId), eq(conversations.context, context)));
    return conversation || undefined;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async updateConversation(id: number, updates: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const [conversation] = await db
      .update(conversations)
      .set(updates)
      .where(eq(conversations.id, id))
      .returning();
    return conversation || undefined;
  }
}

export const storage = new DatabaseStorage();