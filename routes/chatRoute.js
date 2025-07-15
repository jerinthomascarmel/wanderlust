const express = require('express');
const router = express.Router();

router.use(express.json());                
router.use(express.urlencoded({ extended: true }));


router.post('/', async (req, res, next) => {
    try {
        // Dynamically load the ES module
        const chatModule = await import('../controllers/chat/chat.mjs');
        // Call the exported handler
        await chatModule.chatRoute(req, res, next);
    } catch (err) {
        next(err);
    }
});

module.exports = router;

