
const bcrypt = require('bcrypt');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

// Directly mocking the schema structure to avoid import issues with local running
const usersSchema = {
    name: 'users',
    dbName: 'users',
    schema: undefined,
};

async function testLogin() {
    console.log("Testing login for reset_test@example.com...");
    
    // Connect to DB (using localhost port mapping)
    const connectionString = "postgresql://postgres:postgres_password@localhost:5432/oh_oh_oh";
    const sql = postgres(connectionString);
    
    try {
        const users = await sql`SELECT * FROM users WHERE email = 'reset_test@example.com'`;
        
        if (users.length === 0) {
            console.log("User not found!");
            process.exit(1);
        }

        const user = users[0];
        console.log("User found:", user.email);
        console.log("Stored Hash:", user.password_hash);

        const password = "password123";
        const isValid = await bcrypt.compare(password, user.password_hash);

        console.log(`Password '${password}' is valid: ${isValid}`);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await sql.end();
    }
}

testLogin();
