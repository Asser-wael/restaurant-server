import express from "express";
import OrderModel from "../models/Order.js";
import {
    authMiddleware,
    cashierMiddleware,
} from "../middlewares/auth.js";

const router = express.Router();

router.get("/admin/dashboard", authMiddleware, cashierMiddleware, async (req, res) => {
    try {
        const now = new Date();

        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const firstDayOfMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

        const firstDayOfNextMonth = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            1
        );

        const firstDayOfYear = new Date(
            now.getFullYear(),
            0,
            1
        );

        const firstDayOfNextYear = new Date(
            now.getFullYear() + 1,
            0,
            1
        );

        const todayOrders = await OrderModel.find({
            createdAt: {
                $gte: today,
                $lt: tomorrow,
            },
        });

        const monthOrders = await OrderModel.find({
            createdAt: {
                $gte: firstDayOfMonth,
                $lt: firstDayOfNextMonth,
            },
        });

        const yearOrders = await OrderModel.find({
            createdAt: {
                $gte: firstDayOfYear,
                $lt: firstDayOfNextYear,
            },
        });

        res.json({
            day: {
                orders: todayOrders.length,
                revenue: todayOrders.reduce(
                    (sum, order) => sum + order.totalPrice,
                    0
                ),
            },

            month: {
                orders: monthOrders.length,
                revenue: monthOrders.reduce(
                    (sum, order) => sum + order.totalPrice,
                    0
                ),
            },

            year: {
                orders: yearOrders.length,
                revenue: yearOrders.reduce(
                    (sum, order) => sum + order.totalPrice,
                    0
                ),
            },
        });
    } catch (err) {
        console.log(err);

        res.status(500).json({
            message: "Server Error",
        });
    }
}
);

export default router;