const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

/* ===========================
   ROOT ROUTE
=========================== */
app.get("/", (req, res) => {
  res.send("Backend is running successfully 🚀");
});

/* ===========================
   DATABASE CONNECTION
=========================== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Error:", err));

/* ===========================
   USER MODEL
=========================== */
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "client" }
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);

/* ===========================
   AUTH MIDDLEWARE
=========================== */
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const verified = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
};

/* ===========================
   AUTH ROUTES
=========================== */

// REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    res.json({ message: "User registered successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ===========================
   ROUTING ENGINE
=========================== */
function routeRequest({ stakeholder, domain, complexity }) {
  if (domain === "Policy / Institutions") {
    return {
      targetEntity: "Vasudheva Holdings Pvt. Ltd.",
      routingReason: "Policy matters require governance-level handling"
    };
  }

  if (domain === "Education") {
    return {
      targetEntity: "Vasudheva EduInnovation Pvt. Ltd.",
      routingReason: "Education-related case"
    };
  }

  if (domain === "Business / Strategy") {
    return {
      targetEntity: "Vasudheva Strategic Innovations Pvt. Ltd.",
      routingReason: "Business strategy case"
    };
  }

  if (domain === "Media / Communication") {
    return {
      targetEntity: "Vasudheva Media Pvt. Ltd.",
      routingReason: "Media & communication case"
    };
  }

  if (domain === "Publishing") {
    return {
      targetEntity: "Vasudheva Publishing Pvt. Ltd.",
      routingReason: "Publishing & IP case"
    };
  }

  if (complexity === "Institutional / Systemic" || domain === "Multiple / Unsure") {
    return {
      targetEntity: "Vasudheva Holdings Pvt. Ltd.",
      routingReason: "Complex multi-domain case"
    };
  }

  return {
    targetEntity: "Vasudheva Holdings Pvt. Ltd.",
    routingReason: "Default governance assessment"
  };
}

/* ===========================
   CONTACT ROUTE (PUBLIC)
=========================== */
app.post("/api/contact", async (req, res) => {
  try {
    const {
      name,
      email,
      organisation,
      category,
      message,
      stakeholder,
      domain,
      complexity
    } = req.body;

    if (!name || !email || !message)
      return res.status(400).json({ error: "Missing required fields" });

    const routing = routeRequest({ stakeholder, domain, complexity });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      replyTo: email,
      to: process.env.EMAIL_USER,
      subject: `New Contact - ${routing.targetEntity}`,
      html: `
        <h2>New Inquiry</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Organisation:</b> ${organisation}</p>
        <p><b>Category:</b> ${category}</p>
        <p><b>Stakeholder:</b> ${stakeholder}</p>
        <p><b>Domain:</b> ${domain}</p>
        <p><b>Complexity:</b> ${complexity}</p>
        <hr/>
        <p><b>Message:</b></p>
        <p>${message}</p>
        <hr/>
        <p><b>Routed To:</b> ${routing.targetEntity}</p>
        <p><b>Reason:</b> ${routing.routingReason}</p>
      `
    });

    res.json({
      success: true,
      routedTo: routing.targetEntity,
      reason: routing.routingReason
    });

  } catch (error) {
    console.error("Contact Error:", error);
    res.status(500).json({ success: false });
  }
});

/* ===========================
   SERVER START
=========================== */
app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});