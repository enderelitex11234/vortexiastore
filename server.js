const express=require("express");
const session=require("express-session");
const bcrypt=require("bcryptjs");
const helmet=require("helmet");
const rateLimit=require("express-rate-limit");
const fs=require("fs"),path=require("path");
const app=express(),PORT=process.env.PORT||3000;
const DATA=path.join(__dirname,"data.json");
const secret=process.env.SESSION_SECRET||"dev-only-change-this-secret-before-deploy";
const adminUser=process.env.ADMIN_USERNAME||"admin";
const adminHash=bcrypt.hashSync(process.env.ADMIN_PASSWORD||"ChangeThisAdminPassword123!",10);
const initial={products:[
{id:1,name:"Minecraft Java + Bedrock",category:"Minecraft",price:750,stock:5,image:"",description:"Java + Bedrock Edition. Contact support for delivery details.",unlimited:false,active:true},
{id:2,name:"Minecraft Bedrock Android",category:"Minecraft",price:230,stock:0,image:"",description:"Minecraft Bedrock for Android.",unlimited:false,active:true},
{id:3,name:"Minecraft Bedrock iOS",category:"Minecraft",price:330,stock:3,image:"",description:"Minecraft Bedrock for iOS.",unlimited:false,active:true},
{id:4,name:"Minecraft Full Access Account (MCFA)",category:"Accounts",price:800,stock:1,image:"",description:"Availability may vary. Confirm before ordering.",unlimited:false,active:true}
],orders:[],users:[]};
function read(){try{return JSON.parse(fs.readFileSync(DATA,"utf8"))}catch{fs.writeFileSync(DATA,JSON.stringify(initial,null,2));return JSON.parse(JSON.stringify(initial))}}
function save(d){fs.writeFileSync(DATA,JSON.stringify(d,null,2))}
read();
app.use(helmet({contentSecurityPolicy:false}));
app.use(express.json({limit:"300kb"}));
app.use(express.urlencoded({extended:false,limit:"30kb"}));
app.use(session({name:"vortexia.sid",secret,resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:1000*60*60*8}}));
app.use("/api/auth",rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:true,legacyHeaders:false}));
app.use(express.static(path.join(__dirname,"public")));
const clean=s=>String(s??"").trim();
function admin(req,res,next){if(req.session?.admin)return next();return res.status(401).json({error:"Admin login required"})}
function customer(req,res,next){if(req.session?.user)return next();return res.status(401).json({error:"Please log in first"})}
function safeProduct(p){return {...p,status:p.unlimited?"Unlimited":p.stock===0?"Out of Stock":p.stock<=5?"Low Stock":"In Stock"}}
app.get("/api/config",(req,res)=>res.json({storeName:process.env.STORE_NAME||"VORTEXIA STORE",payments:{bKash:process.env.BKASH_NUMBER||"Contact store admin",Nagad:process.env.NAGAD_NUMBER||"Contact store admin",Rocket:process.env.ROCKET_NUMBER||"Contact store admin"}}));
app.get("/api/products",(req,res)=>res.json(read().products.filter(p=>p.active).map(safeProduct)));
app.post("/api/auth/register",(req,res)=>{const email=clean(req.body.email).toLowerCase(),password=String(req.body.password||"");if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<8)return res.status(400).json({error:"Enter a valid email and password of at least 8 characters"});const d=read();if(d.users.some(u=>u.email===email))return res.status(409).json({error:"Account already exists"});const user={id:Date.now(),email,passwordHash:bcrypt.hashSync(password,10)};d.users.push(user);save(d);req.session.user={id:user.id,email:user.email};res.json({email:user.email})});
app.post("/api/auth/login",(req,res)=>{const email=clean(req.body.email).toLowerCase(),password=String(req.body.password||"");const u=read().users.find(x=>x.email===email);if(!u||!bcrypt.compareSync(password,u.passwordHash))return res.status(401).json({error:"Invalid email or password"});req.session.user={id:u.id,email:u.email};res.json({email:u.email})});
app.post("/api/auth/logout",(req,res)=>{req.session.destroy(()=>res.json({ok:true}))});
app.get("/api/auth/me",(req,res)=>res.json({user:req.session.user||null,admin:!!req.session.admin}));
app.post("/api/admin/login",(req,res)=>{const username=clean(req.body.username),password=String(req.body.password||"");if(username!==adminUser||!bcrypt.compareSync(password,adminHash))return res.status(401).json({error:"Invalid admin username or password"});req.session.admin=true;req.session.regenerate(err=>{if(err)return res.status(500).json({error:"Could not create session"});req.session.admin=true;res.json({ok:true})})});
app.post("/api/admin/logout",admin,(req,res)=>{req.session.destroy(()=>res.json({ok:true}))});
app.get("/api/admin/summary",admin,(req,res)=>{const d=read(),p=d.products,o=d.orders;res.json({total:p.length,inStock:p.filter(x=>x.unlimited||x.stock>5).length,lowStock:p.filter(x=>!x.unlimited&&x.stock>0&&x.stock<=5).length,outOfStock:p.filter(x=>!x.unlimited&&x.stock===0).length,orders:o.length,pending:o.filter(x=>x.status==="Payment verification pending").length})});
app.get("/api/admin/products",admin,(req,res)=>res.json(read().products.map(safeProduct)));
app.post("/api/admin/products",admin,(req,res)=>{const p=req.body||{},price=Number(p.price),stock=Number(p.stock);if(!clean(p.name)||!Number.isFinite(price)||price<0||!Number.isInteger(stock)||stock<0)return res.status(400).json({error:"Check product name, price and stock"});const d=read(),x={id:Date.now(),name:clean(p.name),category:clean(p.category)||"General",price,stock,image:clean(p.image),description:clean(p.description),unlimited:!!p.unlimited,active:p.active!==false};d.products.unshift(x);save(d);res.status(201).json(safeProduct(x))});
app.put("/api/admin/products/:id",admin,(req,res)=>{const d=read(),i=d.products.findIndex(p=>p.id===Number(req.params.id)),p=req.body||{},price=Number(p.price),stock=Number(p.stock);if(i<0)return res.status(404).json({error:"Product not found"});if(!clean(p.name)||!Number.isFinite(price)||price<0||!Number.isInteger(stock)||stock<0)return res.status(400).json({error:"Check product name, price and stock"});d.products[i]={...d.products[i],...p,id:d.products[i].id,name:clean(p.name),category:clean(p.category)||"General",price,stock,image:clean(p.image),description:clean(p.description),unlimited:!!p.unlimited,active:p.active!==false};save(d);res.json(safeProduct(d.products[i]))});
app.delete("/api/admin/products/:id",admin,(req,res)=>{const d=read(),n=d.products.length;d.products=d.products.filter(p=>p.id!==Number(req.params.id));if(n===d.products.length)return res.status(404).json({error:"Product not found"});save(d);res.json({ok:true})});
app.get("/api/admin/orders",admin,(req,res)=>res.json(read().orders.slice().reverse()));
app.put("/api/admin/orders/:id",admin,(req,res)=>{const statuses=["Payment verification pending","Paid","Processing","Delivered","Rejected","Cancelled"],d=read(),o=d.orders.find(x=>x.id===Number(req.params.id));if(!o)return res.status(404).json({error:"Order not found"});const next=clean(req.body.status);if(!statuses.includes(next))return res.status(400).json({error:"Invalid status"});if(next==="Paid"&&o.status!=="Paid"&&!o.stockDeducted){for(const line of o.items){const p=d.products.find(x=>x.id===line.productId);if(!p||(!p.unlimited&&p.stock<line.qty))return res.status(409).json({error:"Insufficient stock to approve this order. Update inventory first."})}for(const line of o.items){const p=d.products.find(x=>x.id===line.productId);if(p&&!p.unlimited)p.stock-=line.qty}o.stockDeducted=true;}if((next==="Rejected"||next==="Cancelled")&&o.stockDeducted){for(const line of o.items){const p=d.products.find(x=>x.id===line.productId);if(p&&!p.unlimited)p.stock+=line.qty}o.stockDeducted=false;}o.status=next;o.updatedAt=new Date().toISOString();save(d);res.json(o)});
app.post("/api/orders",customer,(req,res)=>{const {items,paymentMethod,transactionId,phone}=req.body||{};if(!Array.isArray(items)||!items.length||items.length>30)return res.status(400).json({error:"Cart is empty or invalid"});if(!["bKash","Nagad","Rocket"].includes(paymentMethod))return res.status(400).json({error:"Choose a payment method"});if(!clean(transactionId)||!clean(phone))return res.status(400).json({error:"Phone number and transaction ID are required"});const d=read(),lines=[];let total=0;for(const item of items){const p=d.products.find(x=>x.id===Number(item.id)&&x.active);const qty=Number(item.qty);if(!p||!Number.isInteger(qty)||qty<1||(!p.unlimited&&qty>p.stock))return res.status(400).json({error:"A product is unavailable or stock is insufficient. Refresh your cart."});lines.push({productId:p.id,name:p.name,price:p.price,qty});total+=p.price*qty}const order={id:Date.now(),email:req.session.user.email,items:lines,total,paymentMethod,transactionId:clean(transactionId),phone:clean(phone),status:"Payment verification pending",createdAt:new Date().toISOString()};d.orders.push(order);save(d);res.status(201).json({id:order.id,status:order.status,total})});
app.get("/api/orders",customer,(req,res)=>res.json(read().orders.filter(o=>o.email===req.session.user.email).reverse()));
app.get("/admin",(req,res)=>res.sendFile(path.join(__dirname,"public","admin.html")));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`VORTEXIA STORE running at http://localhost:${PORT}`));