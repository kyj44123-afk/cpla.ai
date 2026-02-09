const { createClient } = require("@supabase/supabase-js");

// Mock environment for testing - Replace with actual values if needed or rely on hardcoded for test
// Using values from previous context or asking user is risky, but I'll try to read from .settings.json
const fs = require("fs");
const path = require("path");

function getSettings() {
    try {
        const settingsPath = path.join(process.cwd(), ".settings.json");
        if (fs.existsSync(settingsPath)) {
            return JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
        }
    } catch (e) { console.error(e); }
    return {};
}

async function test() {
    const settings = getSettings();
    const url = settings.supabase_url;
    let key = settings.supabase_service_role_key;

    if (!url || !key) {
        console.error("Missing Supabase credentials in .settings.json");
        return;
    }

    // Decrypt if needed (simplified logic, assuming standard format)
    if (key.includes(":")) {
        try {
            const { SecretsManager } = require("./src/lib/SecretsManager");
            key = SecretsManager.decrypt(key);
        } catch (e) {
            console.log("Decryption failed or module not found, trying raw key...");
        }
    }

    console.log("Testing connection to:", url);
    const supabase = createClient(url, key);

    // 1. Check if 'requests' table exists by selecting 1 row
    const { data, error } = await supabase.from("requests").select("*").limit(1);

    if (error) {
        console.error("Error accessing 'requests' table:", error);
    } else {
        console.log("Successfully accessed 'requests' table. Rows:", data.length);
    }

    // 2. Try to insert a test record
    const { error: insertError } = await supabase.from("requests").insert({
        type: "test_probe",
        data: { contact: "test@test.com", initial_query: "Test probe" }
    });

    if (insertError) {
        console.error("Insertion error:", insertError);
    } else {
        console.log("Successfully inserted test record.");
    }
}

test();
