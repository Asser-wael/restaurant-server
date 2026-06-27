import mongoose from "mongoose";

const popularDishSchema = new mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Meal",
    required: true,
  },
});

export default mongoose.model("popularDish", popularDishSchema);