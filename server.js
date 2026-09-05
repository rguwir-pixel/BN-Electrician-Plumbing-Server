const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json({limit:"10mb"}));

const PORT = process.env.PORT || 3000;
const OWNER_EMAIL = "rguwir@gmail.com";

// Demo in-memory database.
// For production, replace these arrays with PostgreSQL/MySQL/MongoDB.
const users = new Map();
const jobs = [];
const posts = [];
const messages = [];
const subscriptions = [];

function id(){ return crypto.randomUUID(); }

function auth(req,res,next){
  const token = req.headers.authorization?.replace("Bearer ","");
  const user = [...users.values()].find(u => u.token === token);
  if(!user) return res.status(401).json({error:"Unauthorized"});
  req.user = user;
  next();
}

function ownerOnly(req,res,next){
  if(req.user.email !== OWNER_EMAIL || req.user.role !== "OWNER"){
    return res.status(403).json({error:"Owner access only"});
  }
  next();
}

app.get("/api/health",(req,res)=>res.json({ok:true,app:"BN Electrician & Plumbing"}));

app.post("/api/login",(req,res)=>{
  const {email,name,role} = req.body;
  if(!email) return res.status(400).json({error:"Email required"});

  const normalized = email.trim().toLowerCase();
  let user = users.get(normalized);

  if(!user){
    user = {
      id:id(),
      email:normalized,
      name:name || normalized.split("@")[0],
      role: normalized === OWNER_EMAIL ? "OWNER" : (role || "CUSTOMER"),
      token: crypto.randomBytes(32).toString("hex"),
      city:"",
      experience:""
    };
    users.set(normalized,user);
  } else {
    if(normalized === OWNER_EMAIL) user.role="OWNER";
    if(name) user.name=name;
  }

  res.json({
    token:user.token,
    user:{
      id:user.id,email:user.email,name:user.name,role:user.role,
      city:user.city,experience:user.experience
    }
  });
});

app.get("/api/me",auth,(req,res)=>res.json({
  id:req.user.id,email:req.user.email,name:req.user.name,role:req.user.role,
  city:req.user.city,experience:req.user.experience
}));

app.put("/api/profile",auth,(req,res)=>{
  const {name,city,experience} = req.body;
  if(name !== undefined) req.user.name=name;
  if(city !== undefined) req.user.city=city;
  if(experience !== undefined) req.user.experience=experience;
  res.json({ok:true,user:req.user});
});

app.get("/api/jobs",auth,(req,res)=>res.json(jobs));

app.post("/api/jobs",auth,(req,res)=>{
  const {type,title,description,price,phone,location} = req.body;
  if(!title) return res.status(400).json({error:"Job title required"});
  const job = {
    id:id(), type:type||"इलेक्ट्रिशियन", title, description:description||"",
    price:price||"", phone:phone||"", location:location||null,
    ownerId:req.user.id, ownerName:req.user.name, status:"AVAILABLE",
    workerId:null, createdAt:new Date().toISOString()
  };
  jobs.unshift(job);
  res.status(201).json(job);
});

app.post("/api/jobs/:id/take",auth,(req,res)=>{
  const job=jobs.find(x=>x.id===req.params.id);
  if(!job) return res.status(404).json({error:"Job not found"});
  if(job.status!=="AVAILABLE") return res.status(409).json({error:"Job unavailable"});
  job.status="TAKEN";
  job.workerId=req.user.id;
  job.workerName=req.user.name;
  res.json(job);
});

app.post("/api/posts",auth,(req,res)=>{
  const {text,image} = req.body;
  const post={id:id(),userId:req.user.id,userName:req.user.name,text:text||"",image:image||"",createdAt:new Date().toISOString()};
  posts.unshift(post);
  res.status(201).json(post);
});
app.get("/api/posts",auth,(req,res)=>res.json(posts));

app.post("/api/messages",auth,(req,res)=>{
  const {toUserId,text} = req.body;
  if(!toUserId || !text) return res.status(400).json({error:"Recipient and message required"});
  const msg={id:id(),fromUserId:req.user.id,toUserId,text,createdAt:new Date().toISOString()};
  messages.push(msg);
  res.status(201).json(msg);
});
app.get("/api/messages/:userId",auth,(req,res)=>{
  res.json(messages.filter(m =>
    (m.fromUserId===req.user.id && m.toUserId===req.params.userId) ||
    (m.toUserId===req.user.id && m.fromUserId===req.params.userId)
  ));
});

app.post("/api/subscriptions",auth,(req,res)=>{
  if(!["ELECTRICIAN","PLUMBER"].includes(req.user.role)){
    return res.status(403).json({error:"Only workers can subscribe"});
  }
  const {plan} = req.body;
  if(![50,100].includes(Number(plan))) return res.status(400).json({error:"Plan must be 50 or 100"});
  // Payment provider integration belongs here. Never put secret keys in the app.
  const s={id:id(),userId:req.user.id,plan:Number(plan),status:"PENDING_PROVIDER_SETUP",createdAt:new Date().toISOString()};
  subscriptions.push(s);
  res.status(201).json({
    subscription:s,
    message:"UPI AutoPay provider credentials/webhook are required before live payments."
  });
});

// Owner-only API
app.get("/api/admin/dashboard",auth,ownerOnly,(req,res)=>res.json({
  owner:req.user.email,
  users:[...users.values()].map(({token,...u})=>u),
  jobs,posts,subscriptions
}));

app.delete("/api/admin/jobs/:id",auth,ownerOnly,(req,res)=>{
  const i=jobs.findIndex(x=>x.id===req.params.id);
  if(i<0) return res.status(404).json({error:"Job not found"});
  jobs.splice(i,1);
  res.json({ok:true});
});

app.listen(PORT,()=>console.log(`BN server running on http://localhost:${PORT}`));
