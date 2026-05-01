// ============================================================================
// 📁 FILE: constants.js
// 📍 LOCATION: backend/constants.js (root of backend folder)
// 📚 TOPIC: Application Constants / Configuration Values
// ============================================================================
//
// 🎯 PURPOSE:
// This file stores constant values that are used across the application.
// Constants are values that NEVER change during the runtime of the app.
//
// 💡 WHY DO WE NEED A SEPARATE FILE FOR CONSTANTS?
// - Avoid "magic strings" scattered everywhere in your code
// - If the database name changes, update it in ONE place, not 50
// - Makes code easier to read and maintain
// - Other developers instantly know where to find config values
//
// 🔀 ALTERNATIVE APPROACHES:
// - Could use environment variables (.env) for this — and we actually DO for MONGODB_URI
// - Could use a JSON config file (config.json)
// - Could use a config management library like 'convict' or 'config'
// - In larger projects, you might have constants/index.js with multiple exports
//
// 🔮 FUTURE IMPLEMENTATION:
// - Add more constants like MAX_POST_LENGTH, MAX_COMMENT_LENGTH, etc.
// - Add role constants like ROLES = { ADMIN: 'admin', USER: 'user', MODERATOR: 'moderator' }
// - Add pagination defaults like DEFAULT_PAGE_SIZE = 10
// - Add file upload limits like MAX_FILE_SIZE = 5 * 1024 * 1024 (5MB)
// ============================================================================

// We export the database name as a named constant
// 'export' makes this available to other files that import it
// 'const' means this value cannot be reassigned (it's constant/fixed)
// We use UPPER_SNAKE_CASE for constants — this is a JavaScript naming convention
// that tells other developers "this value should never change"
export const DB_NAME = "vibefeed";

// 📝 NOTE: Currently the MONGODB_URI in .env already includes the database name
// so this constant isn't actively used, but it's good practice to have it here
// In case you need to construct the URI dynamically:
// const uri = `${process.env.MONGODB_BASE_URI}/${DB_NAME}`