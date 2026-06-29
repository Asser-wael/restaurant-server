import express from "express";
import OrderModel from "../models/Order.js";
import UserModel from "../models/User.js";
import MealModel from "../models/Meal.js";
import { authMiddleware, cashierMiddleware } from "../middlewares/auth.js";

const router = express.Router();

// ─── helpers ────────────────────────────────────────────────────────────────

function sumRevenue(orders) {
  return orders.reduce((s, o) => s + (o.totalPrice || 0), 0);
}

async function getStats({ start, end }) {
  const [orders, users, products, pendingOrders] = await Promise.all([
    OrderModel.find({ createdAt: { $gte: start, $lt: end } }),
    UserModel.countDocuments({ createdAt: { $gte: start, $lt: end } }),
    MealModel.countDocuments(),
    OrderModel.countDocuments({ status: "pending" }),
  ]);

  const revenue    = sumRevenue(orders);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

  const returnedOrders = orders.filter(o => o.status === "returned").length;
  const returnRate = totalOrders > 0
    ? ((returnedOrders / totalOrders) * 100).toFixed(1)
    : 0;

  return {
    revenue,
    orders: totalOrders,
    users,
    products,
    pendingOrders,
    avgOrderValue: Math.round(avgOrderValue),
    returnRate: parseFloat(returnRate),
  };
}

// ─── chart series builders ───────────────────────────────────────────────────

/** Last 24 hours — one point per hour */
async function buildHourlyChart() {
  const now   = new Date();
  const start = new Date(now); start.setHours(0, 0, 0, 0);

  const points = await Promise.all(
    Array.from({ length: 24 }, async (_, h) => {
      const from = new Date(start); from.setHours(h);
      const to   = new Date(start); to.setHours(h + 1);

      const [orders, users] = await Promise.all([
        OrderModel.find({ createdAt: { $gte: from, $lt: to } }),
        UserModel.countDocuments({ createdAt: { $gte: from, $lt: to } }),
      ]);

      return {
        label:   `${String(h).padStart(2, "0")}:00`,
        revenue: sumRevenue(orders),
        orders:  orders.length,
        users,
      };
    })
  );

  return points;
}

/** Last 30 days — one point per day */
async function buildDailyChart() {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const points = await Promise.all(
    Array.from({ length: 30 }, async (_, i) => {
      const from = new Date(today); from.setDate(today.getDate() - (29 - i));
      const to   = new Date(from);  to.setDate(from.getDate() + 1);

      const [orders, users] = await Promise.all([
        OrderModel.find({ createdAt: { $gte: from, $lt: to } }),
        UserModel.countDocuments({ createdAt: { $gte: from, $lt: to } }),
      ]);

      return {
        label:   `${from.getDate()}/${from.getMonth() + 1}`,
        revenue: sumRevenue(orders),
        orders:  orders.length,
        users,
      };
    })
  );

  return points;
}

/** Current year — one point per month */
async function buildMonthlyChart() {
  const now  = new Date();
  const year = now.getFullYear();
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const points = await Promise.all(
    Array.from({ length: 12 }, async (_, m) => {
      const from = new Date(year, m, 1);
      const to   = new Date(year, m + 1, 1);

      const [orders, users] = await Promise.all([
        OrderModel.find({ createdAt: { $gte: from, $lt: to } }),
        UserModel.countDocuments({ createdAt: { $gte: from, $lt: to } }),
      ]);

      return {
        label:   MONTHS[m],
        revenue: sumRevenue(orders),
        orders:  orders.length,
        users,
      };
    })
  );

  return points;
}

// ─── route ──────────────────────────────────────────────────────────────────

router.get(
  "/admin/dashboard",
  authMiddleware,
  cashierMiddleware,
  async (req, res) => {
    try {
      const now = new Date();

      // period boundaries
      const todayStart        = new Date(now); todayStart.setHours(0, 0, 0, 0);
      const tomorrow          = new Date(todayStart); tomorrow.setDate(todayStart.getDate() + 1);
      const firstDayOfMonth   = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const firstDayOfYear    = new Date(now.getFullYear(), 0, 1);
      const firstDayNextYear  = new Date(now.getFullYear() + 1, 0, 1);

      const [dayStats, monthStats, yearStats, hourlyChart, dailyChart, monthlyChart] =
        await Promise.all([
          getStats({ start: todayStart,      end: tomorrow }),
          getStats({ start: firstDayOfMonth, end: firstDayNextMonth }),
          getStats({ start: firstDayOfYear,  end: firstDayNextYear }),
          buildHourlyChart(),
          buildDailyChart(),
          buildMonthlyChart(),
        ]);

      res.json({
        day:   { ...dayStats,   chart: hourlyChart  },
        month: { ...monthStats, chart: dailyChart   },
        year:  { ...yearStats,  chart: monthlyChart },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

export default router;