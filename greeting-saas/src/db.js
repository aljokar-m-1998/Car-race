const fs = require('fs');
const path = require('path');

const usersPath = path.join(__dirname, '..', 'data', 'users.json');
const templatesPath = path.join(__dirname, '..', 'data', 'templates.json');
const cardsPath = path.join(__dirname, '..', 'data', 'cards.json');

function read(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function write(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function initDb() {
  if (!fs.existsSync(usersPath)) write(usersPath, []);
  if (!fs.existsSync(templatesPath)) write(templatesPath, []);
  if (!fs.existsSync(cardsPath)) write(cardsPath, []);
}

module.exports = {
  initDb,
  usersPath,
  templatesPath,
  cardsPath,
  read,
  write
};
