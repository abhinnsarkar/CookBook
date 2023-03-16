const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");

const auth = require("../../middleware/auth");
const User = require("../../models/User");
const Recipe = require("../../models/Recipe");

// @route  POST api/users
// @desc   Register User
// @access Public
router.post(
  "/",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      //   return res.status(400).json({ errors: errors.array });
      return res.status(400).json(errors);
    }

    const { name, email, password } = req.body;

    try {
      // check if user exists and send error if true
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists" }] });
      }

      user = new User({
        name,
        email,
        password,
      });

      // encrypt password w/ bcrypt
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 1000000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route  GET api/users
// @desc   Gets the User Info/Profile of logged in user
// @access Private
router.get("/", auth, async (req, res) => {
  try {
    // res.send();
    console.log(req.user.id);
    const user = await User.findOne({ _id: req.user.id });
    res.json(user);
    // res.send(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route  PUT api/users/update/:id
// @desc   Update User Info by Id
// @access Private
router.put("/update/:id", auth, async (req, res) => {
  const { name, email, password } = req.body;

  const user = await User.findOne({ _id: req.user.id });
  const usersName = user.name;
  const usersId = user._id;

  const userInfo = {
    name: usersName,
    userId: usersId,
    browserId: req.params.id,
  };

  if (userInfo.userId == userInfo.browserId) {
    console.log("Ids match");
  } else {
    console.log("Ids DO NOT match");
  }

  const userBeingUpdated = user;

  if (name) userBeingUpdated.name = name;
  if (email) userBeingUpdated.email = email;
  // encrypt password w/ bcrypt
  if (password) {
    const salt = await bcrypt.genSalt(10);
    userBeingUpdated.password = await bcrypt.hash(password, salt);
  }

  await userBeingUpdated.save();

  // res.send(user);
  res.send(userBeingUpdated);
});

// @route  DELETE api/users
// @desc   Delete User/Account
// @access Private
router.delete("/", auth, async (req, res) => {
  try {
    await User.findOneAndRemove({ _id: req.user.id });

    const recipes = await Recipe.find({ user: req.user.id });

    if (Object.keys(recipes).length === 0) {
      console.log("no recipes to delete");
    } else {
      const recipesItems = await Recipe.deleteMany({ user: req.user.id });
    }

    res.json({ msg: "User and Recipes Deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
