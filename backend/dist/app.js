const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Add a simple route
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

// Start the server
app.listen(port, () => {
    console.log(`Backend server listening on port ${port}`);
});
