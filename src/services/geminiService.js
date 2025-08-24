const schedule = require('node-schedule');
const axios = require('axios');
const geminiStorage = require('../database/geminiStorage');
require('dotenv').config();

class GeminiService {
  constructor() {
    this.jobs = new Map(); // Store scheduled jobs
    this.apiKey = process.env.GEMINI_API_KEY;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    this.defaultPrompts = [
      {
        id: 'daily-insight',
        prompt: 'Provide a brief daily technology insight or trend in 2-3 sentences.',
        category: 'technology',
        tags: ['daily', 'insight', 'technology']
      },
      {
        id: 'coding-tip',
        prompt: 'Share a useful programming tip or best practice in 2-3 sentences.',
        category: 'programming',
        tags: ['daily', 'coding', 'tips']
      }
    ];
  }

  async initializeSchedules() {
    if (!this.apiKey) {
      console.warn('🔑 GEMINI_API_KEY not configured. Gemini cron jobs will be disabled.');
      return;
    }

    console.log('🔄 Initializing Gemini cron schedules...');
    
    try {
      // Schedule daily Gemini API calls
      // Run every day at 9:00 AM JST
      const dailyJob = schedule.scheduleJob('0 9 * * *', async () => {
        await this.executeDailyPrompts();
      });
      
      this.jobs.set('daily-gemini', dailyJob);
      console.log('✅ Scheduled daily Gemini API calls for 9:00 AM JST');
    } catch (error) {
      console.error('❌ Error initializing Gemini schedules:', error);
    }
  }

  async executeDailyPrompts() {
    console.log('🤖 Executing daily Gemini prompts...');
    
    for (const promptConfig of this.defaultPrompts) {
      try {
        await this.callGeminiAPI(
          promptConfig.prompt,
          promptConfig.category,
          promptConfig.tags,
          'scheduled'
        );
      } catch (error) {
        console.error(`❌ Error executing prompt "${promptConfig.id}":`, error.message);
      }
    }
  }

  async callGeminiAPI(prompt, category = 'general', tags = [], scheduledBy = 'manual') {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const startTime = Date.now();
    
    try {
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      };

      const response = await axios.post(this.apiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.apiKey
        },
        timeout: 30000 // 30 second timeout
      });

      const executionTime = Date.now() - startTime;
      const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response text';
      const tokensUsed = response.data?.usageMetadata?.totalTokenCount || null;

      // Save result to storage
      const result = await geminiStorage.addGeminiResult({
        prompt,
        response: responseText,
        model: 'gemini-2.0-flash',
        status: 'success',
        executionTime,
        tokensUsed,
        category,
        tags,
        scheduledBy
      });

      console.log(`✅ Gemini API call successful (${executionTime}ms, ${tokensUsed || 'unknown'} tokens)`);
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Save error result to storage
      const errorResult = await geminiStorage.addGeminiResult({
        prompt,
        response: null,
        model: 'gemini-2.0-flash',
        status: 'error',
        errorMessage: error.message,
        executionTime,
        category,
        tags,
        scheduledBy
      });

      console.error(`❌ Gemini API error (${executionTime}ms):`, error.message);
      throw error;
    }
  }

  async testGeminiAPI(prompt = 'Hello, can you respond with a simple greeting?') {
    try {
      const result = await this.callGeminiAPI(
        prompt,
        'test',
        ['test', 'api'],
        'test'
      );
      return {
        success: true,
        result,
        message: 'Gemini API test successful'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Gemini API test failed'
      };
    }
  }

  getScheduledJobsCount() {
    return this.jobs.size;
  }

  cancelAllJobs() {
    for (const [name, job] of this.jobs.entries()) {
      job.cancel();
      console.log(`🚫 Cancelled Gemini job: ${name}`);
    }
    this.jobs.clear();
  }

  // Add a manual prompt to be executed immediately
  async executeCustomPrompt(prompt, category = 'custom', tags = []) {
    return await this.callGeminiAPI(prompt, category, tags, 'manual');
  }

  // Schedule a custom cron job
  scheduleCustomJob(name, cronExpression, prompt, category = 'scheduled', tags = []) {
    if (this.jobs.has(name)) {
      this.jobs.get(name).cancel();
    }

    const job = schedule.scheduleJob(cronExpression, async () => {
      try {
        await this.callGeminiAPI(prompt, category, tags, 'custom-schedule');
        console.log(`✅ Custom Gemini job "${name}" executed successfully`);
      } catch (error) {
        console.error(`❌ Custom Gemini job "${name}" failed:`, error.message);
      }
    });

    this.jobs.set(name, job);
    console.log(`📅 Scheduled custom Gemini job "${name}" with cron: ${cronExpression}`);
    return true;
  }

  cancelCustomJob(name) {
    if (this.jobs.has(name)) {
      this.jobs.get(name).cancel();
      this.jobs.delete(name);
      console.log(`🚫 Cancelled custom Gemini job: ${name}`);
      return true;
    }
    return false;
  }

  listActiveJobs() {
    return Array.from(this.jobs.keys());
  }
}

module.exports = new GeminiService();