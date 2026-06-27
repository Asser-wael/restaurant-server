import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,

  resetOtp: String,
  resetOtpExpire: Date,

  cart: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
      },
      quantity: {
        type: Number,
        default: 1,
      },
    },
  ],
  status: {
    type: Boolean,
    enum: [false,true],
  },
  role: {
    type: String,
    enum: ["cashier", "admin", "chef"],
  },
});

const UserModel = mongoose.model("Users", UserSchema);

export default UserModel;