const User = require("./user");
const Blog = require("./blog");
require("dotenv").config();

const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Home
app.get("/", (req, res) => {
  res.send("Backend Server is Running!");
});

// Register
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const user = new User({
    name,
    email,
    password
  });

  await user.save();

  res.json({
    message: "User Registered Successfully!",
    user
  });
});
// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({
      message: "Invalid email or password"
    });
  }

  if (user.password !== password) {
    return res.status(401).json({
      message: "Invalid email or password"
    });
  }

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({
    message: "Login Successful!",
    token
  });
});
// JWT Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Access Token Required"
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        message: "Invalid Token"
      });
    }

    req.user = user;
    next();
  });
}

// Create Blog
app.post("/blogs", authenticateToken, async (req, res) => {
  const { title, content, author,userId } = req.body;

  const blog = new Blog({
    title,
    content,
    author,
    userid
  });

  await blog.save();

  res.json({
    message: "Blog Created Successfully!",
    blog
  });
});

// Get All Blogs
app.get("/blogs", async (req, res) => {
  const blogs = await Blog.find();
  res.json(blogs);
});

// Get Blog By ID
app.get("/blogs/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  res.json(blog);
});

console.log("PUT ROUTE LOADED");
app.put("/blogs/:id", async (req, res) => {
  const { title, content, author } = req.body;

  const blog = await Blog.findByIdAndUpdate(
    req.params.id,
    {
      title,
      content,
      author
    },
    {
      new: true
    }
  );

  res.json({
    message: "Blog Updated Successfully!",
    blog
  });
});

// Delete Blog
app.delete("/blogs/:id", async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);

  res.json({
    message: "Blog Deleted Successfully!"
  });
});

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });