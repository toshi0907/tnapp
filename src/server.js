const { createApp } = require('./createApp');
const { initializeData } = require('./initData');
const notificationService = require('./services/notificationService');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const app = createApp();

async function startServer() {
  try {
    await initializeData();
    
    // Initialize notification schedules
    await notificationService.initializeSchedules();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
