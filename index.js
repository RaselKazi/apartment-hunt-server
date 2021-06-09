const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const fs = require('fs-extra');
const fileUpload = require('express-fileupload');
require('dotenv').config();
// ===========================================================

// PORT:
const port = 5000;
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static('service'));
app.use(fileUpload());

// MONGODB CONNECTION
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xekkt.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});



client.connect((err) => {
 //================================== ALL COLLECTION ======================================
  const apartmentCollection = client.db('dbApartmentHunt').collection('apartments');
  const registrationCollection = client.db('dbApartmentHunt').collection('registration');
  const adminCollection = client.db('dbApartmentHunt').collection('admin');

  //========================= ADD REGISTRATION (CREATE) ============================
  app.post('/addRegistration', (req, res) => {
    const newRegistration = req.body;
    registrationCollection.insertOne(newRegistration).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  //========================= SHOW LOGGED IN CLIENT RENT LIST (READ) ==============================
  app.get('/clientServices', (req, res) => {
    // console.log(req.query.email)
    registrationCollection
      .find({ email: req.query.email })
      .toArray((err, documents) => {
        res.send(documents);
      });
  });

  // Admin dashboard, show all register (Read)
  app.get('/adminServices', (req, res) => {
    registrationCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  //============================== ADD HOUSE (CREATE) ======================================

  app.post('/addHouse', (req, res) => {
    const file = req.files.file;
    const apartment_name = req.body.apartment_name;
    const address = req.body.address;
    const no_bedrooms = req.body.no_bedrooms;
    const no_bathroom = req.body.no_bathroom;
    const rent_month = req.body.rent_month;
    const service_charge = req.body.service_charge;
    const security_deposit = req.body.security_deposit;
    const flat_release_policy = req.body.flat_release_policy;
    const property_details = req.body.property_details;
    const price = req.body.price;
    const newImg = file.data;
    const encImg = newImg.toString('base64');

    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, 'base64'),
    };

    apartmentCollection
      .insertOne({ apartment_name, address, no_bedrooms, no_bathroom, rent_month, service_charge, security_deposit,flat_release_policy, property_details, price, image })
      .then((result) => {
        res.send(result.insertedCount > 0);
      });
  });

  //========================= READ APARTMENTS AND SHOW (READ) ===================================
  app.get('/apartments', (req, res) => {
    apartmentCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });


  //========================= READ USER SELECTED APARTMENT (READ)===================================
  app.get('/apartments/:_id', (req, res) => {
    apartmentCollection
      .find({ _id: ObjectId(req.params._id) })
      .toArray((err, documents) => {
        res.send(documents[0]);
      });
  });

  //========================= UPDATE STATUS OF RENT REQUEST(available for Admin Only) ==================
  app.patch('/updateServiceStatus/:_id', (req, res) => {
    registrationCollection
      .updateOne(
        { _id: ObjectId(req.params._id) },
        {
          $set: { status: req.body.status },
        }
      )
      .then((result) => {
        console.log(result);
        res.send(result.modifiedCount > 0);
      });
  });

 //==================================== ADD ADMIN =================================================
app.post('/addAdmin', (req, res) => {
  const newAdmin = req.body;
  adminCollection.insertOne(newAdmin).then((result) => {
    // console.log(result)
    res.send(result.insertedCount > 0);
  });
});

 //==================================== VERIFY ADMIN LOGIN =========================================
app.post('/isAdmin', (req, res) => {
  const email = req.body.email;
  adminCollection.find({ email: email })
      .toArray((err, admins) => {
        console.log(admins);
          res.send(admins.length > 0);
      })
})

});

// Root:
app.get('/', (req, res) => {
  res.send('The Apartment Hunt Server is running');
});

// Listener port
app.listen(process.env.PORT || port);
