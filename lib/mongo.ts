import { MongoClient, Db } from "mongodb";

// En dev, Next recharge les modules à chaque edit : on met le client sur
// globalThis pour ne pas ouvrir une connexion par rechargement.
const globalForMongo = globalThis as unknown as {
  _mongoClient?: Promise<MongoClient>;
};

function getClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI manquant dans .env.local");

  if (!globalForMongo._mongoClient) {
    globalForMongo._mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
    }).connect();
  }
  return globalForMongo._mongoClient;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(process.env.MONGODB_DB || "habits");
}

/** Crée l'index unique (userId, date) — appelé une fois par le seed. */
export async function ensureIndexes() {
  const db = await getDb();
  await db.collection("entries").createIndex({ userId: 1, date: 1 }, { unique: true });
  await db.collection("profiles").createIndex({ userId: 1 }, { unique: true });
  await db.collection("insights").createIndex({ userId: 1, createdAt: -1 });
  await db.collection("conversations").createIndex({ userId: 1 }, { unique: true });
}
