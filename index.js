import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

const app = express();

const port = process.env.PORT || 8080;

// middelewares
app.use(cors());
app.use(express.json());

// is the server running
app.get("/", (req, res) => res.send("Car-doctor-server is running"));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xfw1t3g.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    const db = client.db("car-doctor");
    const servicesCollection = db.collection("services");
    const bookingCollection = db.collection("booking");

    console.log(`Car-doctor-server is connected with mongodb`);

    // return services data
    app.get("/services", async (req, res) => {
      const cursor = servicesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // return a single service data
    app.get("/services/:id", async (req, res) => {
      const _id = req.params.id;
      const query = {
        _id: new ObjectId(_id),
      };

      const options = {
        projection: {
          title: 1,
          price: 1,
          service_id: 1,
          img: 1,
        },
      };
      const result = await servicesCollection.findOne(query, options);
      res.send(result);
    });

    // insert into db
    app.post("/services/", async (req, res) => {
      const data = req.body;
      const result = await servicesCollection.insertOne(data);
      res.send(result);
    });

    // booking
    app.get("/bookings", async (req, res) => {
      let query = {};
      if (req.query) {
        query = {
          email: req.query.email,
        };
      }

      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    // update order
    app.put("/bookings/:id", cors(), async (req, res) => {
      const _id = req.params.id;
      const query = {
        _id: new ObjectId(_id),
      };

      const options = {
        $set: {
          status: req.body.confirm,
        },
      };

      const result = await bookingCollection.updateOne(query, options);
      res.send(result);
    });

    // delete order
    app.delete("/bookings/:id", async (req, res) => {
      const _id = req.params.id;
      const query = {
        _id: new ObjectId(_id),
      };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// listen on a port
app.listen(port, () =>
  console.log(`Car-doctor-server is running on port ${port}`)
);
