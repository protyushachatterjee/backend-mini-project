const express= require("express");
const app=express();
const path=require("path");
const userModel=require("./models/user");
const postModel=require("./models/post");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcrypt');
const jwt=require('jsonwebtoken');
const multerconfig= require("./config/multerconfig");


app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());



app.get("/", (req, res)=>{
    res.render("index")
})
app.post("/register", async(req, res)=>{
    let{username, name, email, age, password}=req.body
 let oneuser= await userModel.findOne({email});
    if(oneuser){ return res.render("register");}
else{
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, async function(err, hash) {
    let user= await userModel.create({
                username,
                name,
                email,
                age,
                password:hash
            });
            let token= jwt.sign({email: email, userid: user._id}, "shhhhhhhhh");
            res.cookie("token", token);
            res.redirect("/login");
        });
    });
    
}


});

app.get("/profile/uplode", (req, res)=>{
    res.render("profileuplode")
})
app.post("/uplode", isLoggedIn, multerconfig.single("image"),async(req, res)=>{
    const user= await userModel.findOne({email: req.user.email});
    user.profile= req.file.filename;
    await user.save();
    res.redirect("/profile");
})


app.get("/login", (req, res)=>{
    res.render("login");
});

app.get("/profile", isLoggedIn, async (req, res)=>{
    let user= await userModel.findOne({email: req.user.email}).populate("posts");
    // console.log(user.posts);
    res.render("profile", {user});
});

app.get("/likes/:id", isLoggedIn, async(req, res)=>{
    let post= await postModel.findOne({_id: req.params.id}).populate("user");
    // Check if the user has already liked the post
    const userIndex = post.like.indexOf(req.user.userid);
    
    if (userIndex === -1) {
        // User hasn't liked the post, so add the like
        post.like.push(req.user.userid);
    } else {
        // User has already liked the post, so remove the like (unlike)
        post.like.splice(userIndex, 1);
    }
    post.like.push(req.user.userid);
    await post.save();
    res.redirect("/profile");

})
app.get("/edit/:id", isLoggedIn, async(req, res)=>{
    let post= await postModel.findOne({_id: req.params.id}).populate("user");
    res.render("edit", {post})

});
app.post("/update/:id", isLoggedIn, async(req, res)=>{
    let post= await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.area});
    res.redirect("/profile");

});

app.post("/post", isLoggedIn, async (req, res)=>{
    let user= await userModel.findOne({email: req.user.email});
    
    let post= await  postModel.create({
        user: user._id,
        content: req.body.area,

    });

    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
});



app.post("/login", async(req, res)=>{
    let{ email, password, username}=req.body
    
    let user= await userModel.findOne({email});
    if(!user){ return res.status(500).send("Something went wrong");}

    else{
        bcrypt.compare(password, user.password, function(err, result) {
            if(result){
                let token= jwt.sign({email: email, userid: user._id}, "shhhhhhhhh");
                res.cookie("token", token);
                return res.redirect("/profile");
            }
            else{
                res.redirect("/login");
            }
        });
    }
});




app.get("/logout", (req, res)=>{
            res.cookie("token", "");
            res.redirect("/");
})

function isLoggedIn(req, res, next){
    if(req.cookies.token === ""){
        res.redirect("/login");
    }
    else{
            let data=  jwt.verify(req.cookies.token, 'shhhhhhhhh');
            req.user= data;
            next();
    }
}

app.listen(3000)


