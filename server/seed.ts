import { db } from "./db";
import { merchants, platforms, offers, campaigns, analytics } from "../shared/schema";

async function seedDatabase() {
  try {
    console.log("Seeding database...");

    // Create a sample merchant
    const [merchant] = await db.insert(merchants).values({
      name: "Raj's Kitchen",
      email: "raj@rajskitchen.com",
      phone: "+91 9876543210",
      address: "123 MG Road, Bangalore, Karnataka 560001",
      storeTimings: {
        weekdays: { open: "10:00", close: "22:00" },
        weekends: { open: "11:00", close: "23:00" }
      },
      deliverySettings: {
        maxRadius: 5,
        preparationTime: 25,
        slotDuration: 30
      }
    }).returning();

    console.log("Created merchant:", merchant.name);

    // Create sample platforms
    const platformsData = [
      {
        merchantId: merchant.id,
        name: "swiggy",
        isConnected: true,
        credentials: {
          username: "raj@rajskitchen.com",
          encryptedPassword: "encrypted_password_123",
          apiKey: "swiggy_api_key_456"
        },
        status: "active"
      },
      {
        merchantId: merchant.id,
        name: "zomato",
        isConnected: true,
        credentials: {
          username: "rajkitchen",
          encryptedPassword: "encrypted_password_789",
          apiKey: "zomato_api_key_012"
        },
        status: "active"
      },
      {
        merchantId: merchant.id,
        name: "magicpin",
        isConnected: false,
        credentials: null,
        status: "inactive"
      }
    ];

    await db.insert(platforms).values(platformsData);
    console.log("Created platforms");

    // Create sample offers
    const offersData = [
      {
        merchantId: merchant.id,
        title: "Flash Sale - 30% Off",
        description: "Limited time offer on all items",
        discountType: "percentage",
        discountValue: "30",
        minimumOrder: "299",
        platforms: ["swiggy", "zomato"],
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        merchantId: merchant.id,
        title: "Buy 1 Get 1 Free Pizza",
        description: "Valid on all medium pizzas",
        discountType: "bogo",
        discountValue: "100",
        minimumOrder: "599",
        platforms: ["swiggy"],
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    ];

    await db.insert(offers).values(offersData);
    console.log("Created offers");

    // Create sample campaigns
    const campaignsData = [
      {
        merchantId: merchant.id,
        title: "Weekend Warriors",
        description: "Special weekend promotions",
        type: "promotional",
        platforms: ["swiggy", "zomato"],
        status: "active",
        settings: {
          discountType: "percentage",
          discountValue: 25,
          timeSlots: ["19:00-22:00"],
          targetAudience: "premium"
        },
        metrics: {
          views: 1250,
          clicks: 340,
          conversions: 89
        },
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        merchantId: merchant.id,
        title: "Happy Hours",
        description: "Afternoon discounts",
        type: "time_based",
        platforms: ["zomato"],
        status: "scheduled",
        settings: {
          discountType: "fixed",
          discountValue: 50,
          timeSlots: ["14:00-17:00"],
          targetAudience: "all"
        },
        metrics: {
          views: 800,
          clicks: 120,
          conversions: 35
        },
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000)
      }
    ];

    await db.insert(campaigns).values(campaignsData);
    console.log("Created campaigns");

    // Create sample analytics for the last 7 days
    const analyticsData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Overall analytics
      analyticsData.push({
        merchantId: merchant.id,
        date,
        platform: null,
        revenue: (8000 + Math.random() * 6000).toFixed(2),
        orders: Math.floor(30 + Math.random() * 40),
        rating: (4.0 + Math.random() * 1.0).toFixed(1),
        reviews: Math.floor(15 + Math.random() * 25),
        metrics: {
          avgOrderValue: 250 + Math.random() * 100,
          customerSatisfaction: 4.2 + Math.random() * 0.6,
          deliveryTime: 25 + Math.random() * 10,
          cancellationRate: Math.random() * 5
        }
      });

      // Swiggy analytics
      analyticsData.push({
        merchantId: merchant.id,
        date,
        platform: "swiggy",
        revenue: (4000 + Math.random() * 3000).toFixed(2),
        orders: Math.floor(18 + Math.random() * 20),
        rating: (4.2 + Math.random() * 0.6).toFixed(1),
        reviews: Math.floor(8 + Math.random() * 12),
        metrics: {
          avgOrderValue: 280 + Math.random() * 80,
          customerSatisfaction: 4.3 + Math.random() * 0.5,
          deliveryTime: 22 + Math.random() * 8,
          cancellationRate: Math.random() * 4
        }
      });

      // Zomato analytics
      analyticsData.push({
        merchantId: merchant.id,
        date,
        platform: "zomato",
        revenue: (3500 + Math.random() * 2500).toFixed(2),
        orders: Math.floor(12 + Math.random() * 15),
        rating: (4.0 + Math.random() * 0.8).toFixed(1),
        reviews: Math.floor(5 + Math.random() * 10),
        metrics: {
          avgOrderValue: 320 + Math.random() * 120,
          customerSatisfaction: 4.1 + Math.random() * 0.7,
          deliveryTime: 28 + Math.random() * 12,
          cancellationRate: Math.random() * 6
        }
      });
    }

    await db.insert(analytics).values(analyticsData);
    console.log("Created analytics data");

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => process.exit(0));
}

export { seedDatabase };