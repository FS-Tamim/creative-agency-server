const express = require('express');
const bodyParser = require('body-parser');
const cors = require("cors");
const admin = require('firebase-admin');
const ObjectID = require('mongodb').ObjectID;

const fileUpload = require('express-fileupload');
require('dotenv').config();
var serviceAccount = require("./config/creative-agency-62dc1-firebase-adminsdk-l6fbe-87b9c4b709.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://creative-agency-62dc1.firebaseio.com"
});





const MongoClient = require('mongodb').MongoClient;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o2jpm.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express();
app.use(cors());
app.use(bodyParser.json());




app.use(express.static('services'));
app.use(fileUpload());



const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const admins = client.db(process.env.DB_NAME).collection(process.env.DB_COLL);
    const services = client.db(process.env.DB_NAME).collection(process.env.DB_CLLECTION);
    const orders = client.db(process.env.DB_NAME).collection(process.env.DB_COLLS);
    const reviews = client.db(process.env.DB_NAME).collection(process.env.DB_COL);


    app.post('/makeAdmin', (req, res) => {
        const event = req.body;
        admins.insertOne(event)
            .then(result => {
                res.send(result.insertedCount > 0)

            })
    })

    app.post('/addServices', (req, res) => {
        const file = req.files.file;
        const title = req.body.title;
        const description = req.body.description;
        const newImg = file.data;
        const encImg = newImg.toString('base64');


        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        services.insertOne({ title, description, image })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })
    app.post('/order', (req, res) => {

        let image = "No image";
        if (req.files != null) {
            const file = req.files.file;
            const newImg = file.data;
            const encImg = newImg.toString('base64');


            image = {
                contentType: file.mimetype,
                size: file.size,
                img: Buffer.from(encImg, 'base64')
            };
        }
        const name = req.body.name;
        const email = req.body.email;
        const service = req.body.service;
        const details = req.body.details;
        const price = req.body.price;
        const status = req.body.status;
        const serviceImage = req.body.serviceImage;
        const serviceDescription = req.body.serviceDescription;

        orders.insertOne({ name, email, service, details, price, status, serviceImage, serviceDescription, image })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    });

    app.get('/getServiceData/:serviceId', (req, res) => {
        services.find({ _id: ObjectID(req.params.serviceId) })
            .toArray((err, documents) => {
                res.send(documents);
            });
    });

    app.post('/isAdmin', (req, res) => {
        const email = req.body.email;
        admins.find({ email: email })
            .toArray((err, admins) => {
                res.send(admins.length > 0);
            })
    })

    app.post('/review', (req, res) => {

        const review = req.body;
        reviews.insertOne(review)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })


    app.get('/services', (req, res) => {
        services.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });

    app.get('/reviews', (req, res) => {
        reviews.find({}).limit(3)
            .toArray((err, documents) => {
                res.send(documents);
            })
    });

    app.get('/allServiceList', (req, res) => {
        orders.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });


    app.get('/userServices', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    let tokenEmail = decodedToken.email;

                    if (tokenEmail == req.query.email) {
                        orders.find({ email: req.query.email })
                            .toArray((err, document) => {

                                res.status(200).send(document);
                            })
                    }
                    else {
                        res.status(401).send("un-authorised access");
                    }

                }).catch(function (error) {
                    res.status(401).send(" long un-authorised access")
                });
        }
        else {
            res.status(401).send("last un-authorised access");
        }
    });
    app.patch('/updateStatus/:id', (req, res) => {

        orders.updateOne({ _id: ObjectID(req.params.id) },
            {
                $set: { status: req.body.status }
            })
            .then(result => {

                res.send(result.modifiedCount > 0);
            })
    });
    app.get('/status/:id', (req, res) => {
        orders.find({ _id: ObjectID(req.params.id) })
            .toArray((err, documents) => {
                res.send(documents);
            });
    });

});


app.listen(process.env.PORT || 5000);