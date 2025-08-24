const fs = require('fs').promises;
const path = require('path');

class GeminiStorage {
  constructor(filename = 'gemini.json') {
    this.dataDir = path.join(__dirname, '../../data');
    this.filePath = path.join(this.dataDir, filename);
  }

  async ensureDataFile() {
    try {
      await fs.access(this.filePath);
    } catch {
      // データディレクトリが存在しない場合は作成
      await fs.mkdir(this.dataDir, { recursive: true });
      // 初期データファイルを作成
      await fs.writeFile(this.filePath, JSON.stringify([], null, 2));
    }
  }

  async readData() {
    await this.ensureDataFile();
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading gemini data file:', error);
      return [];
    }
  }

  async writeData(data) {
    try {
      await this.ensureDataFile();
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing gemini data file:', error);
      throw error;
    }
  }

  async getGeminiResults() {
    return await this.readData();
  }

  async getGeminiResultById(id) {
    const results = await this.readData();
    return results.find(result => result.id === parseInt(id));
  }

  async addGeminiResult(resultData) {
    const results = await this.readData();
    const newResult = {
      id: Date.now(),
      prompt: resultData.prompt,
      response: resultData.response,
      model: resultData.model || 'gemini-2.0-flash',
      status: resultData.status || 'success',
      errorMessage: resultData.errorMessage || null,
      executionTime: resultData.executionTime || null,
      tokensUsed: resultData.tokensUsed || null,
      category: resultData.category || 'general',
      tags: resultData.tags || [],
      scheduledBy: resultData.scheduledBy || 'manual',
      createdAt: new Date().toISOString(),
      ...resultData
    };
    
    results.push(newResult);
    await this.writeData(results);
    return newResult;
  }

  async updateGeminiResult(id, updateData) {
    const results = await this.readData();
    const index = results.findIndex(result => result.id === parseInt(id));
    
    if (index === -1) {
      return null;
    }
    
    results[index] = {
      ...results[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    await this.writeData(results);
    return results[index];
  }

  async deleteGeminiResult(id) {
    const results = await this.readData();
    const index = results.findIndex(result => result.id === parseInt(id));
    
    if (index === -1) {
      return false;
    }
    
    results.splice(index, 1);
    await this.writeData(results);
    return true;
  }

  async getGeminiResultCount() {
    const results = await this.readData();
    return results.length;
  }

  async getSuccessfulResults() {
    const results = await this.readData();
    return results.filter(result => result.status === 'success');
  }

  async getFailedResults() {
    const results = await this.readData();
    return results.filter(result => result.status === 'error');
  }

  async getSuccessCount() {
    const successful = await this.getSuccessfulResults();
    return successful.length;
  }

  async getFailedCount() {
    const failed = await this.getFailedResults();
    return failed.length;
  }

  async getCategories() {
    const results = await this.readData();
    const categories = new Set();
    results.forEach(result => {
      if (result.category) {
        categories.add(result.category);
      }
    });
    return Array.from(categories).sort();
  }

  async getTags() {
    const results = await this.readData();
    const tags = new Set();
    results.forEach(result => {
      if (result.tags && Array.isArray(result.tags)) {
        result.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }

  async getStats() {
    const results = await this.readData();
    const total = results.length;
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    
    const avgExecutionTime = results
      .filter(r => r.executionTime)
      .reduce((sum, r) => sum + r.executionTime, 0) / 
      (results.filter(r => r.executionTime).length || 1);
    
    const totalTokens = results
      .filter(r => r.tokensUsed)
      .reduce((sum, r) => sum + r.tokensUsed, 0);

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total * 100).toFixed(2) : 0,
      avgExecutionTime: Math.round(avgExecutionTime),
      totalTokens
    };
  }

  async getRecentResults(limit = 10) {
    const results = await this.readData();
    return results
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }
}

module.exports = new GeminiStorage();