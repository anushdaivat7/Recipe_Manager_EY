const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");

const Admin = require("./models/Admin"); // Ensure correct path

const app = express();
const PORT = 3000;

// ✅ Configure CORS correctly (Allow only frontend)
app.use(
  cors({
    origin: "http://localhost:3001", // ✅ Set specific frontend origin
    credentials: true, // ✅ Allow cookies & authentication headers
  })
);

// Middleware
app.use(bodyParser.json());
app.use(express.json({ limit: "10mb" })); // ✅ Set JSON size limit
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// 🔹 Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/EY")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ✅ User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// ✅ Recipe Schema
const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  ingredients: { type: [String], required: true },
  instructions: { type: [String], required: true },
  image: { type: String },
});

const Recipe = mongoose.model("Recipe", recipeSchema);

// ✅ Home Route
app.get("/", (req, res) => {
  res.send("<h1>Express JS API with MongoDB!</h1>");
});

// ✅ GET all users
app.get("/user", async (req, res) => {
  try {
    const users = await User.find();
    res.json({ status: "200", data: users });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ POST - Add new user
app.post(
  "/adduser",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("email").notEmpty().withMessage("Email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password } = req.body;
      const newUser = new User({ username, email, password });
      await newUser.save();

      res.status(201).json({ data: true, message: "User registered successfully" });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// ✅ POST - User login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    return res.status(200).json({ message: "Login successful" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ DELETE User by ID
app.delete("/deleteuser/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully", data: deletedUser });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ GET All Recipes
app.get("/getrecipe", async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.json({ status: "200", data: recipes });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ POST - Add a Recipe
app.post("/addrecipes", async (req, res) => {
  const { title, ingredients, instructions, image } = req.body;

  if (!title || !ingredients || !instructions) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newRecipe = new Recipe({ title, ingredients, instructions, image });
    await newRecipe.save();
    res.status(201).json({ message: "Recipe added successfully", data: newRecipe });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ DELETE Recipe by ID
app.delete("/deleterecipe/:id", async (req, res) => {
  try {
    const result = await Recipe.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Recipe not found" });

    res.json({ message: "Recipe deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting recipe", error });
  }
});

// ✅ GET Admins
app.get("/admin", async (req, res) => {
  try {
    const admins = await Admin.find();
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: "Error fetching admins", error: err.message });
  }
});

// ✅ POST - Register Admin
app.post("/admin/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return res.status(400).json({ message: "Email already exists!" });

    const hashedPassword = await bcrypt.hash(password, 10); // ✅ Secure password
    const newAdmin = new Admin({ name, email, password: hashedPassword });
    await newAdmin.save();

    res.status(201).json({ message: "Registration successful!", admin: newAdmin });
  } catch (err) {
    res.status(500).json({ message: "Error registering admin", error: err.message });
  }
});

// ✅ POST - Admin Login (Using bcrypt)
app.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ message: "Invalid credentials!" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials!" });

    res.status(200).json({ message: "Login successful!", admin });
  } catch (err) {
    res.status(500).json({ message: "Error during login", error: err.message });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
