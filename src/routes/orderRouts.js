import express, { json } from "express";
import OrderModel from "../models/Order.js";
import dotenv from "dotenv";
import { getIO } from "../config/socket.js";
import upload from "../middlewares/upload.js";
import { authMiddleware, cashierMiddleware } from "../middlewares/auth.js";
import webpush from "web-push";

dotenv.config();

const router = express.Router();
////////////////////////////////////////////////////////
webpush.setVapidDetails(
    "mailto:admin@restaurant.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

let adminSubscriptions = [];

router.post("/save-subscription", (req, res) => {
    const sub = req.body;
    const exists = adminSubscriptions.find(
        (s) => s.endpoint === sub.endpoint
    );
    if (!exists) {
        adminSubscriptions.push(sub);
    }
    res.json({ ok: true });
});
router.post("/delete-subscription", (req, res) => {
    const { endpoint } = req.body;
    adminSubscriptions = adminSubscriptions.filter(
        sub => sub.endpoint !== endpoint
    );
    res.json({ ok: true });
});

/////////////////////////////////////////////////////////////
router.get(
    "/admin/orders",
    authMiddleware,
    cashierMiddleware,
    async (req, res) => {
        const orders = await OrderModel.find()
            .populate("cart.productId")
            .sort({ createdAt: -1 });
        res.json(orders);
    }
);

router.get(
    "/admin/orders/:id",
    authMiddleware,
    cashierMiddleware,
    async (req, res) => {
        const order = await OrderModel.findById(req.params.id).populate(
            "cart.productId"
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json(order);
    }
);

router.post("/checkOut", upload.single("image"), async (req, res) => {
    try {
        const { paymentMethod, tableNumber, walletType, walletName, walletNumber } =
            req.body;

        const cart = JSON.parse(req.body.cart);
        const image = req.file?.filename;

        const totalPrice = cart.reduce((sum, item) => {
            return sum + item.price * item.count;
        }, 0);

        const order = await OrderModel.create({
            paymentMethod,
            tableNumber,
            walletType,
            walletName,
            walletNumber,
            image,
            cart,
            totalPrice,
        });

        const io = getIO();
        io.to("admin").emit("newOrder", order);

        // ✅ بعت Push Notification لكل الـ admins
        const payload = JSON.stringify({
            title: "🛒 New Order",
            body: `Table ${order.tableNumber}`,
        });

        adminSubscriptions.forEach((sub) => {
            webpush.sendNotification(sub, payload).catch((err) => {
                // لو الـ subscription انتهت صلاحيتها شيلها
                if (err.statusCode === 410) {
                    adminSubscriptions = adminSubscriptions.filter(
                        (s) => s.endpoint !== sub.endpoint
                    );
                }
            });
        });

        res.status(200).json({
            message: "Order just sended",
            type: "order",
            order,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "order error" });
    }
});

router.put("/updateOrderStatus", async (req, res) => {
    try {
        const { id, status } = req.body;

        const order = await OrderModel.findByIdAndUpdate(
            id,
            { status },
            { returnDocument: "after" }
        );

        const io = getIO();
        io.to(`table-${order.tableNumber}`).emit("order-status-updated", {
            orderId: order._id,
            status: order.status,
        });

        res.json({
            message: "Order just updated",
            type: "success",
            order,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "order error" });
    }
});

export default router;