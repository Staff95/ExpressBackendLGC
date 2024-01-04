var express = require('express');
var app = express();
//Middleware pour récupéré la donnée
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: false}));

require('dotenv').config();

//Connexion à mongodb(Base de donnée) :
var mongoose = require('mongoose'); 
const url = process.env.DATABASE_URL;

mongoose.connect(url)
.then(console.log("Mongodb connected"))
.catch(err => console.log(err));




// Système de vue EJS(inutile avec react)
app.set('view engine', 'ejs');

// Mettre à disposition les données et les rendres accessible pour le front
const cors = require('cors');
//de base
//app.use(cors());
//Transmettre TOUT type de données meme sensible (JWT)
app.use(cors({credentials: true, origin: process.env.FRONTEND_URL}));

//Method put et delete pour express
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

//bcrypt : hashage de mot de passe
const bcrypt = require('bcrypt');

// Import JWT
const {createTokens, validateToken} = require('./JWT');

// import JWT-decode
const {jwtDecode} = require('jwt-decode')

// Cookie-parser
var cookieParser = require('cookie-parser');
app.use(cookieParser());

//  MULTER : images 
const multer = require('multer');
app.use(express.static("uploads"));

const storage = multer.diskStorage({
    destination: (req,file,cb) => {
        cb(null, 'uploads/')
    },
    filename:(req,file,cb) => {
        cb(null,file.originalname); // Use original file name
    },
});
const upload = multer({storage});


//Models :

var Contact = require('./models/Contact');

// =============== APP.GET =================================

//Contact
app.get('/', function(req, res){
    // res.sendFile(path.resolve('index.html'));
    Contact.find()
    .then((data)=>{
        console.log(data);
        res.json(data);
    })
    .catch(err => console.log(err));
});

app.get('/newContact', function(req, res){
    res.render('NewContact');
});

app.get('/contact/:id', function(req, res){
    Contact.findOne({
        _id : req.params.id
    })
    .then((data)=>{
        res.render('Edit', {data: data});
    })
    .catch(err => console.log(err));
});





// ============= APP.POST =============
app.post('/submit-data', function(req, res){
    var name = req.body.firstname + ' ' + req.body.lastname;
    res.send(name + ' Submitted successfully');
})

app.post('/submit-contact', function(req, res){
    const Data = new Contact({
        nom : req.body.nom,
        prenom : req.body.prenom,
        email : req.body.email,
        message : req.body.message
    })
    
    
    
    Data.save()
    .then(()=>{
        console.log("Data saved successfully");
        res.redirect('/');
    })
    .catch(err=>{
        console.log(err);
    });
});



//Ajout d'un blog
app.post('/addblog', upload.single('image'), function(req, res){

    const Data = new Blog({
        titre : req.body.titre,
        sousTitre : req.body.sousTitre,
        auteur : req.body.auteur,
        description : req.body.description,
        imageName : req.body.imageName
    })

    // Image obligatoire pour l'enregistrement d'un blog
    if(!req.files){
        res.status(400).json("No File Uploaded")
    }
    else{
        Data.save()
        .then(() =>{
            console.log("Blog saved");
            res.json("Blog saved")
            // res.redirect(process.env.FRONTEND_URL + '/allblogs/');
        })
        .catch(err =>console.error(err));
    }
});
app.post('/uploadimage', upload.single('image'), function(req, res){
    if(!req.file){
        res.status(400).json("No file uploaded!");
    }
    else{
        res.json("file uploaded successfully!")
    }
});

app.post('/multiupload', upload.array('images',5), (req, res) =>{
    if(!req.files || !req.files.length === 0) {
        res.status(400).json("No files uploaded!");
    }
    else{
        res.json("file uploaded successfully!")
    }
});

// ================ APP.PUT ====================
app.put('/edit/:id', function(req, res){
    const Data = {
        nom : req.body.nom,
        prenom : req.body.prenom,
        email : req.body.email,
        message : req.body.message
    }
    Contact.updateOne({_id : req.params.id}, {$set: Data})
    .then(()=>{
        console.log("Data updated successfully");
        res.redirect('/'); 
    })
    .catch(err=>{console.log(err);});
})

    
// ================ APP.DELETE ====================
app.delete('/delete/:id', function(req, res){
    Contact.findOneAndDelete({
        _id : req.params.id
    })
    .then(()=>{
        console.log("Data deleted successfully");
        res.redirect(process.env.FRONTEND_URL + '/allblogs/'); 
    })
    .catch(err=>{console.log(err);});
})

//Blog
var Blog = require('./models/Blog');
//affichage formulaire nouveau blog
app.get('/newblog', function(req, res){
    res.render('NewBlog')
});


//recuperation de les blogs
app.get('/allblogs', function(req, res){
    Blog.find()
    .then((data)=>{
        res.json(data);
    })
});
//page qui affiche le formulaire d'edition
app.get('/blog/:id', function(req, res){
    Blog.findOne({
        _id : req.params.id
    })
    .then((data)=>{
        res.json(data);
    })
});

//Update
app.put('/editblog/:id', function(req, res){
    const Data = {
        titre : req.body.titre,
        sousTitre : req.body.sousTitre,
        auteur : req.body.auteur,
        description : req.body.description
    }

    Blog.updateOne({
        _id : req.params.id
    }, {$set:Data})
    .then(()=>{
        res.redirect(process.env.FRONTEND_URL + '/allblogs/')
    })
    .catch((err)=>{
        console.log(err);
    }); 
});

app.delete('/deleteblog/:id', function(req, res) {
    Blog.findOneAndDelete({_id:req.params.id})
    .then(()=>{
        console.log("Blog deleted");
        res.redirect(process.env.FRONTEND_URL + '/allblogs/');
    })
    .catch((err)=>{console.log(err);})
});

//User
const User = require('./models/User');

//Inscription 
app.post('/api/inscription', function(req, res){
    const Data = new User({
        username : req.body.username,
        email : req.body.email,
        password : bcrypt.hashSync(req.body.password, 10),
        admin : req.body.admin
    })

    Data.save()
    .then(()=>{
        console.log("User saved !");
        res.redirect('/signin');
    })
    .catch(err=>{console.log(err);});
})

app.get('/signup', function(req, res){
    res.render('Inscription');
})
app.get('/signin', function(req, res){
    res.render('Connexion');
})

app.post('/api/connexion', function(req, res){
    User.findOne({
        username : req.body.username
    }).then(user =>{
        if(!user)
        {
            return res.status(404).send("No user found");
        }
        if(!bcrypt.compareSync(req.body.password, user.password)){
            return res.status(404).send("Invalid password");
        }

        const accessToken = createTokens(user);
        res.cookie("access-token", accessToken,{
            maxAge: 1000 * 1000 * 60 * 24  * 30,
            httpOnly:true,
        })

        res.redirect("process.env.FRONTEND_URL");
        // res.json("LOGGED IN");
        // res.render('UserPage', {data : user})
    })
    .catch(err =>{console.log(err);});

});

app.get('/logout',(req, res)=> {
    res.clearCookie("access-token");
    res.redirect(process.env.FRONTEND_URL)
});


app.get('/getJWT', function(req, res){
    res.json(jwtDecode(req.cookies["access-token"]));
});

var server = app.listen(5000, function() {
    console.log("Server listening on port 5000");
});