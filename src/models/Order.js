import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    paymentMethod: {
      type: String,
      enum: ["cash", "wallet"],
      required: true,
    },

    tableNumber: {
      type: Number,
      required: true,
    },

    walletType: String,
    walletName: String,
    walletNumber: String,

    image : {
      type: String,
      default: null,
    },

    cart: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Meal",
        },

        name: String,
        price: Number,
        count: Number, // 👈 بدل count
        image: String,
        size: String,
      },
    ],

    totalPrice: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "preparing", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);
const OrderModel = mongoose.model("Order", OrderSchema);

export default OrderModel;