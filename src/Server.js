const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3000;
const OWNER_EMAIL = "rguwir@gmail.com";

// Static files serve karne ke liye
app.use(express.static(path.join(__dirname, 'app')));

// Root route handler
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

// APIs and other routes...
const users = new Map();
const jobs = [];
const posts = [];
const messages = [];
const subscriptions = [];
const otpStore = new Map();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: OWNER_EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

function id() { return crypto.randomUUID(); }

function auth(req, res, next) {
  const token = req.headers.authorization;
  const user = [...users.values()].find(u => u.token === token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  req.user = user;
  next();
}

function ownerOnly(req, res, next) {
  if (req.user.email !== OWNER_EMAIL) {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
}

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.post("/api/request-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  const normalized = email.trim().toLowerCase();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(normalized, { otp, expires: Date.now() + 10 * 60 * 1000 });
  try {
    await transporter.sendMail({
      from: `"BN Electrician" <${OWNER_EMAIL}>`,
      to: normalized,
      subject: "आपका लॉगिन OTP",
      text: `BN Electrician & Plumbing में लॉगिन करने के लिए आपका OTP है: ${otp}`
    });
    res.json({ message: "OTP sent" });
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.post("/api/login", (req, res) => {
  const { email, name, role, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Details required" });
  const normalized = email.trim().toLowerCase();
  const storedData = otpStore.get(normalized);
  if (!storedData || storedData.expires < Date.now()) {
    return res.status(400).json({ error: "OTP expired" });
  }
  if (storedData.otp !== otp) {
    return res.status(400).json({ error: "Invalid OTP" });
  }
  otpStore.delete(normalized);
  let user = users.get(normalized);
  if (user) {
    if (name) user.name = name;
  } else {
    user = {
      id: id(),
      email: normalized,
      name: name || normalized.split('@')[0],
      role: normalized === OWNER_EMAIL ? "OWNER" : "CUSTOMER",
      token: crypto.randomBytes(32).toString('hex'),
      city: "",
      experience: ""
    };
    users.set(normalized, user);
  }
  res.json({
    token: user.token,
    user: {
      id: user.id, email: user.email, name: user.name,
      role: user.role, city: user.city, experience: user.experience
    }
  });
});

app.get("/api/me", auth, (req, res) => {
  res.json({
    id: req.user.id, email: req.user.email, name: req.user.name,
    city: req.user.city, experience: req.user.experience
  });
});

app.put("/api/profile", auth, (req, res) => {
  const { name, city, experience } = req.body;
  if (name !== undefined) req.user.name = name;
  if (city !== undefined) req.user.city = city;
  if (experience !== undefined) req.user.experience = experience;
  res.json({ ok: true, user: req.user });
});

app.get("/api/jobs", auth, (req, res) => {
  res.json(jobs);
});

app.post("/api/jobs", auth, (req, res) => {
  const { title, price, location } = req.body;
  const job = {
    id: id(),
    type: "इलेक्ट्रीशियन",
    title,
    price: price || "",
    location,
    ownerId: req.user.id,
    workerId: null,
    createdAt: new Date()
  };
  jobs.unshift(job);
  res.status(201).json(job);
});

app.post("/api/jobs/:id", auth, (req, res) => {
  const job = jobs.find(x => x.id === req.params.id);
  if (!job) return res.status(404).json({ error: "Not found" });
  if (job.workerId) return res.status(400).json({ error: "Taken" });
  job.workerId = req.user.id;
  job.workerName = req.user.name;
  res.json(job);
});

app.post("/api/posts", auth, (req, res) => {
  const { text, image } = req.body;
  const post = { id: id(), userId: req.user.id, name: req.user.name, text, image };
  posts.unshift(post);
  res.status(201).json(post);
});

app.get("/api/posts", auth, (req, res) => {
  res.json(posts);
});

app.post("/api/messages", auth, (req, res) => {
  const { toUserId, text } = req.body;
  if (!toUserId || !text) return res.status(400).json({ error: "Details required" });
  const msg = { id: id(), fromUserId: req.user.id, toUserId, text };
  messages.push(msg);
  res.status(201).json(msg);
});

app.get("/api/messages/:userId", auth, (req, res) => {
  res.json(messages.filter(m =>
    (m.fromUserId === req.user.id && m.toUserId === req.params.userId) ||
    (m.fromUserId === req.params.userId && m.toUserId === req.user.id)
  ));
});

app.post("/api/subscriptions", auth, (req, res) => {
  const { plan } = req.body;
  if (!["ELECTRICIAN", "PLUMBER"].includes(plan)) {
    return res.status(403).json({ error: "Invalid plan" });
  }
  if (![50, 100].includes(Number(plan))) {
    return res.status(400).json({ error: "Invalid amount" });
  }
  const s = { id: id(), userId: req.user.id, plan };
  subscriptions.push(s);
  res.status(201).json({
    subscription: s,
    message: "UPI AutoPay provider credentials missing"
  });
});

app.get("/api/admin/dashboard", auth, ownerOnly, (req, res) => {
  res.json({
    owner: req.user.email,
    users: [...users.values()].map(u => ({ token: u.token, jobs, posts, subscriptions }))
  });
});

app.delete("/api/admin/jobs/:id", auth, ownerOnly, (req, res) => {
  const i = jobs.findIndex(x => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: "Not found" });
  jobs.splice(i, 1);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`BN server running on http://localhost:${PORT}`));
