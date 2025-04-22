const fs = require("node:fs");
const csv = require("csv-parser");

class NumberValidationService {
  constructor(client) {
    this.client = client;
  }

  async isNumberInWhatsapp(number) {
    try {
      const numberId = await this.client.getNumberId(number);
      return numberId !== null;
    } catch (error) {
      console.error('Error checking number:', error);
      return false;
    }
  }

  async readNumbersFromCSV(filePath) {
   return new Promise((resolve, reject) => {
     const numbers = [];
     fs.createReadStream(filePath)
       .pipe(csv())
       .on('data', (row) => {
         if (row.number) {
           numbers.push(row.number);
         }
       })
       .on('end', () => {
         resolve(numbers);
       })
       .on('error', (error) => {
         reject(error);
       });
   }).catch((error) => {
     console.error('Error reading CSV file:', error);
     return [];
   });
  }

  async validateNumbers(numbers) {
    const results = [];
    for (const number of numbers) {
      const isUser = await this.isNumberInWhatsapp(number);
      results.push({ number, isUser });
    }
    return results;
  }

  async validateNumbersFromCSV(filePath) {
    const numbers = await this.readNumbersFromCSV(filePath);
    return await this.validateNumbers(numbers);
  }

}

module.exports = NumberValidationService;