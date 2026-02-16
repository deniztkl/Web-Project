const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
console.log('SESSION_SECRET DEĞİŞKENİ:', process.env.SESSION_SECRET ? 'BAŞARIYLA YÜKLENDİ' : '!!! YÜKLENEMEDİ - TANIMSIZ !!!');
const User = require('./models/User');
const Museum = require('./models/Museum');

const app = express();
const PORT = process.env.PORT || 3000;

const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
});

app.set('trust proxy', 1);

const corsOptions = {
  origin: 'https://dijitalmuzeler.onrender.com',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 14 * 24 * 60 * 60
  }),
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    console.log("Şifre sıfırlama isteği geldi:", email);

    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log("Kullanıcı bulunamadı.");
            return res.status(404).json({ message: "Bu mail adresi bulunamadı." });
        }

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; 
        await user.save();

        const resetUrl = `https://dijitalmuzeler.onrender.com/html/reset-password.html?token=${token}`;

        const mailOptions = {
            to: user.email,
            subject: 'Şifre Sıfırlama Talebi - Dijital Müze',
            html: `<h1>Şifre Sıfırlama</h1><p>Link: ${resetUrl}</p>`
        };

        console.log("Mail gönderiliyor...");
        await transporter.sendMail(mailOptions);
        console.log("Mail başarıyla gönderildi!");
        
        return res.json({ message: "Sıfırlama linki mailinize gönderildi!" });

    } catch (err) {
        console.error("MAİL GÖNDERME HATASI DETAYI:", err);
        return res.status(500).json({ message: "Sistem hatası: " + err.message });
    }
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/html/login.html');
  }
  next();
}

// === SAYFA YÖNLENDİRMELERİ ===
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

app.get('/html/profile.html', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'profile.html'));
});

app.get('/index.html', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// === API ENDPOINT'LERİ ===

app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        // 1. Alanların doluluğunu kontrol et
        if (!username || !email || !password) {
            return res.status(400).send('Lütfen tüm alanları doldurun.');
        }

        // 2. Username Uzunluk ve Karakter Kontrolü
        if (username.length < 3 || username.length > 16) {
            return res.status(400).send('Kullanıcı adı 3 ila 16 karakter arasında olmalıdır.');
        }
        const usernameRegex = /^[a-zA-Z]+$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).send('Kullanıcı adı sadece İngilizce harfler içerebilir.');
        }

        // 3. Email Format Kontrolü (Yeni eklendi)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).send('Geçersiz e-posta formatı.');
        }

        // 4. Şifre Uzunluk ve Karmaşıklık Kontrolü
        if (password.length < 8) {
            return res.status(400).send('Şifre en az 8 karakter uzunluğunda olmalıdır.');
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).send('Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir sembol içermelidir.');
        }

        // 5. Çakışma Kontrolü (Username ve Email aynı anda kontrol ediliyor)
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(409).send('Bu kullanıcı adı zaten var.');
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(409).send('Bu e-posta adresi zaten kayıtlı.');
        }

        // 6. Tek Bir Kullanıcı Kaydı Oluşturma
        const user = new User({ 
            username, 
            email, 
            password, 
            visitedMuseums: [], 
            wishlist: [] 
        });

        await user.save();

        // 7. Oturumu Başlat ve Yanıt Gönder
        req.session.userId = user._id;
        // Not: Sadece bir kez yanıt gönderiyoruz
        return res.status(201).send('Kayıt başarılı!');

    } catch (error) {
        console.error("Register Error:", error);
        if (!res.headersSent) {
            res.status(500).send("Sunucuda bir hata oluştu.");
        }
    }
});

// Giriş yap
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) return res.status(401).send('Geçersiz bilgiler.');
  req.session.userId = user._id;
  res.sendStatus(200);
});

// Çıkış yap
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Çıkış yapılamadı.');
    }
    res.clearCookie('connect.sid');
    res.sendStatus(200);
  });
});

// Giriş yapan kullanıcıyı getir
app.get('/api/user', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Giriş yapılmamış.' });
  }
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy();
      res.clearCookie('connect.sid');
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }
    res.json({ username: user.username, visitedMuseums: user.visitedMuseums, wishlist: user.wishlist });
  } catch (err) {
    console.error("GET /api/user HATA:", err);
    res.status(500).json({ error: "Sunucu hatası, kullanıcı verisi alınamadı." });
  }
});

// API: Müze işlemleri

// Tüm müzeleri getir
app.get('/api/museum', async (req, res) => {
  try {
    const museums = await Museum.find();
    res.json(museums);
  } catch (err) {
    res.status(500).send('Müzeler getirilemedi.');
  }
});

// ID ile tek müze getir
app.get('/api/museums/:id', async (req, res) => {
  try {
    const museum = await Museum.findOne({ id: req.params.id });
    if (!museum) return res.status(404).send('Müze bulunamadı.');
    res.json(museum);
  } catch (err) {
    res.status(500).send('Müze getirilemedi.');
  }
});

// API: Liste işlemleri
app.post('/api/visited/:museumId', async (req, res) => {
  try {
    const userId = req.session.userId;
    const museumId = req.params.museumId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).send("Kullanıcı bulunamadı.");

    user.wishlist = user.wishlist.filter(id => id.toString() !== museumId.toString());
    
    if (!user.visitedMuseums.includes(museumId)) {
      user.visitedMuseums.push(museumId);
    }

    await user.save();
    res.status(200).json({ message: "Ziyaret edilen müzelere eklendi." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ziyaret edilen müzelere eklenemedi." });
  }
});

// Bir müzeyi wishlist'e ekle
app.post('/api/wishlist/:museumId', async (req, res) => {
  try {
    const userId = req.session.userId;
    const museumId = req.params.museumId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).send("Kullanıcı bulunamadı.");

    user.visitedMuseums = user.visitedMuseums.filter(id => id.toString() !== museumId.toString());
    
    if (!user.wishlist.includes(museumId)) {
      user.wishlist.push(museumId);
    }

    await user.save();
    res.status(200).json({ message: "Wishlist'e eklendi." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Wishlist'e eklenemedi." });
  }
});

// Müze bir listeden diğerine taşınır
app.post('/api/move/:museumId', async (req, res) => {
  try {
    const userId = req.session.userId;
    const museumId = req.params.museumId;
    const { from, to } = req.body;

    // Liste isimleri geçerli mi?
    if (!["wishlist", "visitedMuseums"].includes(from) || !["wishlist", "visitedMuseums"].includes(to)) {
      return res.status(400).send("Geçersiz liste.");
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).send("Kullanıcı bulunamadı.");

    // Müze "from" listesinden çıkarılır
    user[from] = user[from].filter(id => id.toString() !== museumId.toString());

    // Müze "to" listesine eklenir
    if (!user[to].some(id => id.toString() === museumId.toString())) {
      user[to].push(museumId);
    }

    await user.save();
    res.status(200).json({ message: "Müze başarıyla taşındı." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Taşıma işlemi başarısız." });
  }
});

// Müze bir listeden kaldırılır (silme işlemi)
app.delete('/api/remove/:museumId/:from', async (req, res) => {
  try {
    const userId = req.session.userId;
    const museumId = req.params.museumId;
    const from = req.params.from;

    if (!userId) return res.status(401).json({ error: "Giriş yapılmamış." });
    if (!["wishlist", "visitedMuseums"].includes(from)) {
      return res.status(400).send("Geçersiz liste.");
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).send("Kullanıcı bulunamadı.");

    user[from] = user[from].filter(id => id.toString() !== museumId.toString());
    await user.save();

    res.status(200).json({ message: "Müze listeden kaldırıldı." });
  } catch (err) {
    console.error("REMOVE ERROR:", err);
    res.status(500).json({ error: "Kaldırma işlemi başarısız." });
  }
});
