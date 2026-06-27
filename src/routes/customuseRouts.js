// import express from "express";
// import CategoryModel from "../models/Category.js";
// import popularDishModel from "../models/popularDish.js";
// import upload from "../middlewares/upload.js";
// import fs from "fs";

// const router = express.Router();

// /* ================= GET CATEGORIES ================= */

// router.get("/getAllCategories", async (req, res) => {
//   try {
//     const data = await CategoryModel.find();

//     res.json({
//       message: "Categories fetched",
//       type: "success",
//       data,
//     });
//   } catch (err) {
//     console.log(err);
//   }
// });

// /* ================= GET POPULAR ================= */

// router.get("/getPopularDishs", async (req, res) => {
//   try {
//     const data = await popularDishModel.find().populate("id");

//     res.json({
//       message: "Popular fetched",
//       type: "success",
//       data,
//     });
//   } catch (err) {
//     console.log(err);
//   }
// });

// /* ================= ADD CATEGORY ================= */

// router.post("/addNewCategory", upload.single("image"), async (req, res) => {
//   try {
//     const data = await CategoryModel.create({
//       name: req.body.name,
//       image: req.file?.filename,
//     });

//     res.json({
//       message: "Category created",
//       type: "success",
//       data,
//     });
//   } catch (err) {
//     console.log(err);
//   }
// });

// /* ================= DELETE CATEGORY ================= */

// router.delete("/deleteCategory/:id", async (req, res) => {
//   try {
//     const cat = await CategoryModel.findById(req.params.id);

//     if (cat?.image) {
//       fs.unlink(`uploads/${cat.image}`, () => {});
//     }

//     await CategoryModel.findByIdAndDelete(req.params.id);

//     res.json({
//       message: "Category deleted",
//       type: "success",
//     });
//   } catch (err) {
//     console.log(err);
//   }
// });

// /* ================= ADD POPULAR ================= */

// router.post("/addPopular", async (req, res) => {
//   try {
//     const { id } = req.body;

//     const exists = await popularDishModel.findOne({ id });

//     if (exists) {
//       return res.status(400).json({
//         message: "Already in popular",
//         type: "error",
//       });
//     }

//     const popularDish = await popularDishModel.create({ id });

//     res.json({
//       message: "Added to popular",
//       type: "success",
//       popularDish,
//     });
//   } catch (err) {
//     console.log(err);
//   }
// });

// /* ================= DELETE POPULAR ================= */

// router.delete("/deletePopular/:id", async (req, res) => {
//   try {
//     await popularDishModel.findOneAndDelete({ id: req.params.id });

//     res.json({
//       message: "Removed from popular",
//       type: "success",
//     });
//   } catch (err) {
//     console.log(err);
//   }
// });

// export default router;


import express from "express";
import CategoryModel from "../models/Category.js";
import popularDishModel from "../models/popularDish.js";
import upload from "../middlewares/upload.js";
import fs from "fs";

const router = express.Router();

// CATEGORIES
router.get("/getAllCategories", async (req, res) => {
  const data = await CategoryModel.find();
  res.json({ data });
});

router.post("/addNewCategory", upload.single("image"), async (req, res) => {
  const cat = await CategoryModel.create({
    name: req.body.name,
    image: req.file?.filename,
  });

  res.json({ data: cat, message: "Created", type: "success" });
});

router.delete("/deleteCategory/:id", async (req, res) => {
  await CategoryModel.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted", type: "success" });
});

// POPULAR 
router.get("/getPopularDishs", async (req, res) => {
  const data = await popularDishModel.find().populate("id");
  res.json({ data });
});

router.post("/addPopular", async (req, res) => {
  const exists = await popularDishModel.findOne({ id: req.body.id });

  if (exists) {
    return res.json({ message: "Already exists", type: "error" });
  }

  const pop = await popularDishModel.create({
    id: req.body.id,
  });

  res.json({
    popularDish: pop,
    message: "Added",
    type: "success",
  });
});

router.delete("/deletePopular/:id", async (req, res) => {
  await popularDishModel.deleteOne({ id: req.params.id });
  res.json({ message: "Removed", type: "success" });
});

export default router;