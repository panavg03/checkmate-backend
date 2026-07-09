import pool  from './pg.js';


/**
 *              TABLE STRUCTURE
 * 
 * 
 *          | Userid (PRIMARY) | googleId | email | username | createdAt | lastLogin | 
 * 
 * 
 */

async function getTeamId(userId : number){
    const query = "";
    const values = [userId];
    try{
        const result = await pool.query(query,values);
        return result.rows[0];
    }catch(error){
        console.error("oh no! solve this shit: ",error);
        throw error;
    }

}
