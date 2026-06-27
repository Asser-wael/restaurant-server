import express, { json } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import OrderModel from "../models/Order.js";
import dotenv from "dotenv";
import { getIO } from "../config/socket.js";
import upload from "../middlewares/upload.js";
import { authMiddleware, cashierMiddleware } from "../middlewares/auth.js";
dotenv.config();

const router = express.Router();



// GET ALL orders (ADMIN)
router.get("/admin/orders",
    authMiddleware, cashierMiddleware,
    async (req, res) => {

        const orders = await OrderModel.find().populate("cart.productId").sort({ createdAt: -1 });
        res.json(orders);

    });

router.get("/admin/orders/:id",
    authMiddleware,
    cashierMiddleware,
    async (req, res) => {
        const order = await OrderModel.findById(req.params.id)
            .populate("cart.productId");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json(order);
    }
);

router.post("/checkOut", upload.single("image"), async (req, res) => {
    try {
        const { paymentMethod, tableNumber, walletType, walletName, walletNumber } = req.body;

        const cart = JSON.parse(req.body.cart);
        const image = req.file?.filename;

        const totalPrice = cart.reduce((sum, item) => {
            return sum + (item.price * item.count);
        }, 0);

        const order = await OrderModel.create({
            paymentMethod,
            tableNumber,
            walletType,
            walletName,
            walletNumber,
            image,
            cart,
            totalPrice
        });

        const io = getIO();
        io.to("admin").emit("newOrder", order);
        
        res.status(200).json({
            message: "Order just sended",
            type: "order",
            order
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
            order
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "order error" });
    }
});




















export default router;
