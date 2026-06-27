import express from "express";
import MealModel from "../models/Meal.js";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.js";
import upload from "../middlewares/upload.js";
import fs from "fs";
import { log } from "console";
const router = express.Router();



// GET
router.get("/getAllRecipes", async (req, res) => {
    try {
        const recipes = await MealModel.find()
        res.json({
            message: "Menu fetched successfully",
            type: "success",
            data: recipes
        })
    } catch (error) {
        console.log(error);
    }
})
// GET offer
router.get("/getOffers", async (req, res) => {
    try {
        const recipes = await MealModel.aggregate([
            {
                $match: {
                    offer: true,
                }
            },
            { $sample: { size: 3 } }
        ]);
        res.json({data:recipes});

    } catch (error) {
        console.log(error);
    }
})
// router.get("/getOffers", async (req, res) => {
//     try {
//         const recipes = await MealModel.aggregate([
//             {
//                 $match: {
//                     offer: true,
//                 }
//             },
//             { $sample: { size: 8 } }
//         ]);
//         res.json({data:recipes});

//     } catch (error) {
//         console.log(error);
//     }
// })
// GET re...
router.get("/viewRecipe/:id", async (req, res) => {
    try {
        const recipe = await MealModel.findById(req.params.id)
        res.json({
            message: "Menu fetched successfully",
            type: "success",
            data: recipe
        })
    } catch (error) {
        console.log(error);
    }
})
// Delete

router.delete("/removeRecipe/:id", async (req, res) => {
    try {
        const recipe = await MealModel.findById(req.params.id);

        if (recipe?.image) {
            fs.unlink(`uploads/${recipe.image}`, () => { });
        }

        await MealModel.findByIdAndDelete(req.params.id);
        res.json({
            message: "Recipe deleted successfully",
            type: "success",
        })
    } catch (error) {
        console.log(error);
    }
})
// ADD

router.post("/addRecipe", upload.single("image"), async (req, res) => {
    try {
        const recipe = await MealModel.create({
            name: req.body.name,
            description: req.body.description,
            Category: req.body.Category,
            availability: req.body.availability == "true",
            offer: req.body.offer === "true",
            image: req.file?.filename,
            sizes: JSON.parse(req.body.sizes || "[]"),
        });

        res.json({
            message: "Recipe created successfully",
            type: "success",
            data: recipe,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});
router.put(
    "/editRecipe/:id",
    upload.single("image"),
    async (req, res) => {
        try {

            const { id } = req.params;
            const updateData = {
                ...req.body, sizes: JSON.parse(req.body.sizes || "[]")
            };


            if (req.file) {
                updateData.image = req.file.filename;
            }
            const recipe = await MealModel.findByIdAndUpdate(
                id,
                updateData,
                {
                    returnDocument: "after",
                    runValidators: true,
                }
            );

            res.json({
                message: "Recipe updated successfully",
                type: "success",
                data: recipe,
            });
        } catch (error) {
            console.log(error);

            res.status(500).json({
                message: "Server Error",
                type: "error",
            });
        }
    }
);
export default router;
