import pool from "../../../shared/db/pg";
import { PartyService } from "../services/party.service";

async function runTest() {
    console.log(" Starting Party Service Integration Tests...");

    try {
        // 1. Ensure test users exist in user_auth
        console.log("Setting up test users in PostgreSQL...");
        
        // Delete previous test users to start fresh
        await pool.query("DELETE FROM user_auth WHERE email IN ($1, $2)", [
            "test_leader@example.com",
            "test_member@example.com"
        ]);

        const leaderRes = await pool.query(`
            INSERT INTO user_auth (googleId, email, username)
            VALUES ($1, $2, $3)
            RETURNING userId;
        `, ["google_test_leader", "test_leader@example.com", "test_leader"]);
        const leaderId = leaderRes.rows[0].userid;

        const memberRes = await pool.query(`
            INSERT INTO user_auth (googleId, email, username)
            VALUES ($1, $2, $3)
            RETURNING userId;
        `, ["google_test_member", "test_member@example.com", "test_member"]);
        const memberId = memberRes.rows[0].userid;

        console.log(`Test users created. Leader ID: ${leaderId}, Member ID: ${memberId}`);

        // 2. Test Party Creation (without password)
        console.log("\nTesting: Create Party without password...");
        const party = await PartyService.createParty({
            name: "Test Room No Pass",
            leaderId,
            maxPlayers: 2
        });
        console.log("Party created successfully:", party);

        // 3. Test Join Party
        console.log(`\nTesting: Member joining party ${party.id}...`);
        await PartyService.joinParty({
            partyId: party.id,
            userId: memberId
        });
        console.log("Member joined successfully!");

        // 4. Test Get Party Details
        console.log("\nTesting: Get Party details...");
        let details = await PartyService.getPartyDetails(party.id);
        console.log("Party Details:", JSON.stringify(details, null, 2));

        // 5. Test Party is Full
        console.log("\nTesting: Exceeding capacity (limit is 2)...");
        try {
            // Create a third user
            const thirdUserRes = await pool.query(`
                INSERT INTO user_auth (googleId, email, username)
                VALUES ($1, $2, $3)
                RETURNING userId;
            `, ["google_test_third", "test_third@example.com", "test_third"]);
            const thirdUserId = thirdUserRes.rows[0].userid;

            await PartyService.joinParty({
                partyId: party.id,
                userId: thirdUserId
            });
            console.log(" Error: Exceeded capacity but request succeeded.");
        } catch (err: any) {
            console.log(" Expected failure succeeded:", err.message);
        }

        // Clean up third user
        await pool.query("DELETE FROM user_auth WHERE email = $1", ["test_third@example.com"]);

        // 6. Test Party with password
        console.log("\nTesting: Create Party with password...");
        const privateParty = await PartyService.createParty({
            name: "Secure Room",
            password: "supersecretpassword",
            leaderId,
            maxPlayers: 4
        });
        console.log("Private party created:", privateParty);

        // Join with wrong password
        console.log("\nTesting: Join private party with wrong password...");
        try {
            await PartyService.joinParty({
                partyId: privateParty.id,
                userId: memberId,
                password: "wrongpassword"
            });
            console.log(" Error: Wrong password was accepted.");
        } catch (err: any) {
            console.log(" Expected failure succeeded:", err.message);
        }

        // Join with correct password
        console.log("\nTesting: Join private party with correct password...");
        await PartyService.joinParty({
            partyId: privateParty.id,
            userId: memberId,
            password: "supersecretpassword"
        })
        console.log(" Joined private party successfully!");

        // 7. Test Member Leaving
        console.log(`\nTesting: Member leaving party ${privateParty.id}...`);
        await PartyService.leaveParty(privateParty.id, memberId);
        console.log("Member left. Fetching details...");
        details = await PartyService.getPartyDetails(privateParty.id);
        console.log("Party Details after member left:", JSON.stringify(details, null, 2));

        // 8. Test Leader Leaving (should delete party)
        console.log(`\nTesting: Leader leaving party ${privateParty.id} (should delete party)...`);
        await PartyService.leaveParty(privateParty.id, leaderId);
        
        try {
            await PartyService.getPartyDetails(privateParty.id);
            console.log(" Error: Party was not deleted when empty.");
        } catch (err: any) {
            console.log(" Expected failure (party deleted):", err.message);
        }

        // Cleanup
        await pool.query("DELETE FROM user_auth WHERE email IN ($1, $2)", [
            "test_leader@example.com",
            "test_member@example.com"
        ]);
        console.log("\n All tests passed successfully!");
    } catch (error) {
        console.error(" Integration test failed:", error);
    } finally {
        // End the PG pool connection
        await pool.end();
        process.exit(0);
    }
}

runTest();
