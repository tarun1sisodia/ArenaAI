import { createClient } from "@supabase/supabase-js";
import pg from "pg";

try {
  process.loadEnvFile?.(".env");
} catch {}

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!url || !serviceKey || !databaseUrl) {
  console.error("Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or DATABASE_URL in environment.");
  process.exit(1);
}

const supabaseUrl: string = url;
const supabaseServiceKey: string = serviceKey;
const pgDatabaseUrl: string = databaseUrl;

const SEED_CUSTOMER = {
  email: "test.customer@agraskbagheltourandtravels.com",
  password: "CustomerTest@2026!",
  fullName: "Test Customer",
  phone: "+919876543299",
  role: "customer" as const,
};

async function seed() {
  console.log("==> Initializing Supabase Admin client...");
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Check if user already exists in Supabase Auth
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Failed to list users:", listError);
    process.exit(1);
  }

  let user = listData.users.find((u) => u.email?.toLowerCase() === SEED_CUSTOMER.email.toLowerCase());

  if (user) {
    console.log(`User ${SEED_CUSTOMER.email} already exists (ID: ${user.id}). Updating password & metadata...`);
    const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: SEED_CUSTOMER.password,
      email_confirm: true,
      user_metadata: { full_name: SEED_CUSTOMER.fullName },
      app_metadata: { role: SEED_CUSTOMER.role },
    });
    if (updateError) {
      console.error("Failed to update user:", updateError);
      process.exit(1);
    }
    user = updated.user;
  } else {
    console.log(`Creating user ${SEED_CUSTOMER.email}...`);
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: SEED_CUSTOMER.email,
      password: SEED_CUSTOMER.password,
      email_confirm: true,
      user_metadata: { full_name: SEED_CUSTOMER.fullName },
      app_metadata: { role: SEED_CUSTOMER.role },
    });
    if (createError) {
      console.error("Failed to create user:", createError);
      process.exit(1);
    }
    user = created.user;
  }

  console.log(`==> Supabase Auth User ID: ${user.id}`);

  // 2. Upsert profile in PostgreSQL
  console.log("==> Upserting into PostgreSQL profiles table...");
  const pgClient = new pg.Client({ connectionString: pgDatabaseUrl });
  await pgClient.connect();

  try {
    const res = await pgClient.query(
      `INSERT INTO profiles (id, full_name, phone, email, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         phone = EXCLUDED.phone,
         email = EXCLUDED.email,
         role = EXCLUDED.role,
         updated_at = NOW()
       RETURNING id, full_name, phone, email, role;`,
      [user.id, SEED_CUSTOMER.fullName, SEED_CUSTOMER.phone, SEED_CUSTOMER.email, SEED_CUSTOMER.role]
    );

    console.log("✅ Seed profile successfully upserted in PostgreSQL:");
    console.log(res.rows[0]);
  } finally {
    await pgClient.end();
  }

  console.log("\n========================================================");
  console.log(" Customer Seed Account Ready:");
  console.log(` Email:    ${SEED_CUSTOMER.email}`);
  console.log(` Password: ${SEED_CUSTOMER.password}`);
  console.log(` Phone:    ${SEED_CUSTOMER.phone}`);
  console.log(` Name:     ${SEED_CUSTOMER.fullName}`);
  console.log(` Role:     ${SEED_CUSTOMER.role}`);
  console.log(` User ID:  ${user.id}`);
  console.log("========================================================\n");
}

void seed();
