import { MongoClient } from 'mongodb';

const mongoUri = "mongodb://admin:GandhamSpices@ac-olif5ap-shard-00-00.7yd5f7j.mongodb.net:27017,ac-olif5ap-shard-00-01.7yd5f7j.mongodb.net:27017,ac-olif5ap-shard-00-02.7yd5f7j.mongodb.net:27017/gandham_spices?ssl=true&replicaSet=atlas-110us1-shard-0&authSource=admin";

async function inspectMongo() {
  console.log('Connecting to inspect MongoDB Atlas...');
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db('gandham_spices');
    const collection = db.collection('state');
    const docs = await collection.find({}).toArray();
    console.log('--- Database Documents Found ---');
    docs.forEach(doc => {
      console.log('Document ID:', doc.id);
      if (doc.data) {
        console.log('Users Count:', doc.data.users?.length);
        console.log('Products Count:', doc.data.products?.length);
        console.log('Batches Count:', doc.data.batches?.length);
        console.log('Sales Count:', doc.data.sales?.length);
        if (doc.data.batches && doc.data.batches.length > 0) {
          console.log('Sample Batch produced:', doc.data.batches[0].packetsProduced);
        }
      } else {
        console.log('No data field found in document!');
      }
    });
  } catch (err) {
    console.error('Error during inspection:', err);
  } finally {
    await client.close();
  }
}

inspectMongo();
