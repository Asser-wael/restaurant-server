import mongoose from "mongoose";

const MealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },
    Category: {
      type: String,
      required: true,
    },
    offer: {
      type: Boolean,
      default: false,
    },
    availability: {
      type: Boolean,
      default: false,
    },


    image: {
      type: String,
    },

    sizes: [
      {
        size: {
          type: String,
          enum: ["Small", "Medium", "Large"],
          required: true,
        },
        price: {
          type: Number,
          required: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);


const MealModel = mongoose.model("Meal", MealSchema);

export default MealModel;