const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

// مسارات ملفات البيانات
const dataDir = path.join(__dirname, 'data');
const usersPath = path.join(dataDir, 'users.json');
const templatesPath = path.join(dataDir, 'templates.json');
const cardsPath = path.join(dataDir, 'cards.json');

// دوال مساعدة لقراءة وكتابة JSON
function read(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]');
}
function write(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// إنشاء مجلد data لو مش موجود
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// إنشاء ملفات JSON فاضية لو مش موجودة
[usersPath, templatesPath, cardsPath].forEach(file => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, '[]');
  }
});

const app = express();
const PORT = process.env.PORT || 3000;
const FREE_LAUNCH = true; // طول فترة التجربة كل القوالب متاحة

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// جلب القوالب
app.get('/api/templates', (req, res) => {
  let templates = read(templatesPath);
  if (!FREE_LAUNCH) {
    templates = templates.filter(t => !t.is_premium);
  }
  res.json(templates);
});

// إنشاء بطاقة (بدون تسجيل دخول)
app.post('/api/cards', (req, res) => {
  const { template_id, data } = req.body || {};
  if (!template_id || !data) {
    return res.status(400).json({ error: 'template_id/data required' });
  }

  const slug = Math.random().toString(36).slice(2, 8);
  const cards = read(cardsPath);
  const newCard = {
    id: Date.now(),
    user_id: null, // مفيش مستخدم مسجل
    template_id,
    slug,
    data,
    views: 0
  };
  cards.push(newCard);
  write(cardsPath, cards);

  res.json({ url: `/c/${slug}`, slug });
});

// عرض بطاقة
app.get('/api/cards/:slug', (req, res) => {
  const cards = read(cardsPath);
  const templates = read(templatesPath);
  const card = cards.find(c => c.slug === req.params.slug);
  if (!card) return res.status(404).json({ error: 'not found' });

  const template = templates.find(t => t.id === card.template_id);
  card.views += 1;
  write(cardsPath, cards);
  res.json({
    slug: card.slug,
    data: card.data,
    template: template || {}
  });
});

// صفحات الواجهة
app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/create', (_, res) => res.sendFile(path.join(__dirname, 'public', 'create.html')));
app.get('/admin', (_, res) => res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html')));
app.get('/c/:slug', (_, res) => res.sendFile(path.join(__dirname, 'public', 'view.html')));

// تشغيل السيرفر
app.listen(PORT, () => console.log(`✅ Running on http://localhost:${PORT}`));
