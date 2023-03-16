const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const Recipe = require("../../models/Recipe");

// @route  POST api/recipes
// @desc   Add a Recipe
// @access Private
router.post(
  "/",
  auth,
  [
    check("name", "Please enter a name for the Recipe").not().isEmpty(),
    check("ingredients", "Please enter some comma seperated Ingredients")
      .not()
      .isEmpty(),
    check("instructions", "Please enter some comma seperated Instructions")
      .not()
      .isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, ingredients, instructions, prepTime, cookTime } = req.body;
    const ingredientsObj = {};
    const instructionsObj = {};
    const timesObj = {};
    try {
      // console.log(`type of ingredients is ${typeof ingredients}`);
      if (typeof ingredients == "string") {
        ingredientsObj.ingredients = ingredients
          .split(",")
          .map((ingredient) => ingredient.trim());
      }
      if (typeof instructions == "string") {
        instructionsObj.instructions = instructions
          .split(",")
          .map((instruction) => instruction.trim());
      }
      if (prepTime) timesObj.prepTime = prepTime;
      if (cookTime) timesObj.cookTime = cookTime;

      if (Object.keys(timesObj).length === 0) {
        // _______________________________________
        // no prep or cooking time provided
        // _______________________________________

        const user = await User.findById(req.user.id).select("-password");
        const newRecipe = new Recipe({
          user: user.id,
          name,
          ingredients: ingredientsObj.ingredients,
          instructions: instructionsObj.instructions,
        });
        const recipe = await newRecipe.save();
        res.json(recipe);
      } else {
        // _______________________________________
        // prep or cooking time provided
        // _______________________________________

        if (Object.keys(timesObj).length === 2) {
          // BOTH were given
          const user = await User.findById(req.user.id).select("-password");
          const newRecipe = new Recipe({
            user: user.id,
            name,
            ingredients: ingredientsObj.ingredients,
            instructions: instructionsObj.instructions,
            prepTime: timesObj["prepTime"],
            cookTime: timesObj["cookTime"],
          });
          const recipe = await newRecipe.save();
          res.json(recipe);
        } else {
          // ONE was given
          // check WHICH

          if (timesObj["prepTime"] === undefined) {
            // no prepTime
            // cookTime given
            const user = await User.findById(req.user.id).select("-password");
            const newRecipe = new Recipe({
              user: user.id,
              name,
              ingredients: ingredientsObj.ingredients,
              instructions: instructionsObj.instructions,
              cookTime: timesObj["cookTime"],
            });
            const recipe = await newRecipe.save();
            res.json(recipe);
          } else {
            // prepTime given
            // no cookTime
            const user = await User.findById(req.user.id).select("-password");
            const newRecipe = new Recipe({
              user: user.id,
              name,
              ingredients: ingredientsObj.ingredients,
              instructions: instructionsObj.instructions,
              prepTime: timesObj["prepTime"],
            });
            const recipe = await newRecipe.save();
            res.json(recipe);
          }
        }
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route  Put api/recipes/:id
// @desc   Update specific Recipe by its id
// @access Private
router.put("/:id", auth, async (req, res) => {
  const { name, ingredients, instructions, prepTime, cookTime } = req.body;
  console.log("given data is", req.body);
  const recipeBeingUpdated = await Recipe.findOne({ _id: req.params.id });
  if (name) recipeBeingUpdated.name = name;
  if (ingredients) recipeBeingUpdated.ingredients = ingredients;
  if (instructions) recipeBeingUpdated.instructions = instructions;
  if (prepTime) recipeBeingUpdated.prepTime = prepTime;
  if (cookTime) recipeBeingUpdated.cookTime = cookTime;

  await recipeBeingUpdated.save();

  res.send(recipeBeingUpdated);
});

// @route  GET api/recipes
// @desc   Get all the recipes for logged in user
// @access Private
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.id });
    const recipes = await Recipe.find({ user: req.user.id });
    if (recipes == 0) {
      // console.log("No Recipes");
      return res.status(404).json({ msg: `No Recipes for ${user.name}` });
    }
    res.json(recipes);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Recipes not found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route  DELETE api/recipes
// @desc   Delete a Recipe by it's id
// @access Private
router.delete("/:id", auth, async (req, res) => {
  try {
    console.log(`user ${req.user.id}`);
    console.log(`params ${req.params.id}`);
    // res.json("Trying to DELETE a Recipe by its Id");
    // const recipe = await Recipe.findById(req.params.id);
    await Recipe.findOneAndRemove({ _id: req.params.id });

    res.json("Recipe Deleted");
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Recipe not found" });
    }
    res.status(500).send("Server Error");
  }
});

module.exports = router;
