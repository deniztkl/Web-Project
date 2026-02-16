const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');
const { Resend } = require('resend');
require('dotenv').config();

const User = require('./models/User');
const Museum = require('./models/Museum');

const app = express();
const PORT = process.env.PORT || 3000;
const resend = new Resend(process.env.RESEND_API_KEY);

// === ARA YAZILIMLAR (MIDDLEWARES) ===
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
    secret: process.env.SESSION_SECRET || 'gizli-anahtar',
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

// Giriş Kontrolü Middleware
function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/html/login.html');
    }
    next();
}

// === VERİTABANI BAĞLANTISI ===
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error('MongoDB connection error:', err));

// === SAYFA YÖNLENDİRMELERİ ===
app.get('/', (req, res) => res.redirect('/index.html'));
app.get('/html/profile.html', requireLogin, (req, res) => res.sendFile(path.join(__dirname, 'public', 'html', 'profile.html')));
app.get('/index.html', requireLogin, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// === AUTH API (Kayıt, Giriş, Şifre Sıfırlama) ===

// Şifre Sıfırlama İsteği (Resend ile)
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Bu mail adresi bulunamadı." });

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; 
        await user.save();

        const resetUrl = `https://dijitalmuzeler.onrender.com/html/reset-password.html?token=${token}`;

        const { error } = await resend.emails.send({
            from: 'Digital Museum <onboarding@resend.dev>',
            to: [user.email],
            subject: 'Şifre Sıfırlama Talebi - Dijital Müze',
            html: `
                <div style="background-color: #0f1113; color: white; padding: 20px; font-family: sans-serif;">
                    <h1 style="color: #d4af37;">Şifre Sıfırlama</h1>
                    <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
                    <a href="${resetUrl}" style="background-color: #d4af37; color: black; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">Şifremi Sıfırla</a>
                    <p>Bu link 1 saat geçerlidir.</p>
                </div>`
        });

        if (error) throw error;
        res.json({ message: "Sıfırlama linki mailinize gönderildi!" });
    } catch (err) {
        console.error("Mail Hatası:", err);
        res.status(500).json({ message: "Mail gönderilirken bir hata oluştu." });
    }
});

app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (!username || !email || !password) return res.status(400).send('Lütfen tüm alanları doldurun.');
        
        // Validasyonlar
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/;

        if (username.length < 3 || username.length > 16 || !/^[a-zA-Z]+$/.test(username)) {
            return res.status(400).send('Kullanıcı adı geçersiz.');
        }
        if (!emailRegex.test(email)) return res.status(400).send('Geçersiz e-posta formatı.');
        if (password.length < 8 || !passwordRegex.test(password)) return res.status(400).send('Şifre kriterleri karşılamıyor.');

        // Çakışma Kontrolü
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) return res.status(409).send('Kullanıcı adı veya e-posta zaten kullanımda.');

        const user = new User({ username, email, password, visitedMuseums: [], wishlist: [] });
        await user.save();

        req.session.userId = user._id;
        res.status(201).send('Kayıt başarılı!');
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).send("Sunucuda bir hata oluştu.");
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).send('Geçersiz bilgiler.');
    req.session.userId = user._id;
    res.sendStatus(200);
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).send('Çıkış yapılamadı.');
        res.clearCookie('connect.sid');
        res.sendStatus(200);
    });
});

app.get('/api/user', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Giriş yapılmamış.' });
    try {
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        res.json({ username: user.username, visitedMuseums: user.visitedMuseums, wishlist: user.wishlist });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası." });
    }
});

// === MÜZE VE LİSTE API ===

app.get('/api/museum', async (req, res) => {
    try {
        const museums = await Museum.find();
        res.json(museums);
    } catch (err) {
        res.status(500).send('Müzeler getirilemedi.');
    }
});

app.get('/api/museums/:id', async (req, res) => {
    try {
        const museum = await Museum.findOne({ id: req.params.id });
        if (!museum) return res.status(404).send('Müze bulunamadı.');
        res.json(museum);
    } catch (err) {
        res.status(500).send('Müze getirilemedi.');
    }
});

app.post('/api/visited/:museumId', async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        const museumId = req.params.museumId;
        user.wishlist = user.wishlist.filter(id => id.toString() !== museumId);
        if (!user.visitedMuseums.includes(museumId)) user.visitedMuseums.push(museumId);
        await user.save();
        res.status(200).json({ message: "Ziyaret edilenlere eklendi." });
    } catch (err) {
        res.status(500).json({ error: "Hata oluştu." });
    }
});

app.post('/api/wishlist/:museumId', async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        const museumId = req.params.museumId;
        user.visitedMuseums = user.visitedMuseums.filter(id => id.toString() !== museumId);
        if (!user.wishlist.includes(museumId)) user.wishlist.push(museumId);
        await user.save();
        res.status(200).json({ message: "Wishlist'e eklendi." });
    } catch (err) {
        res.status(500).json({ error: "Hata oluştu." });
    }
});

app.post('/api/move/:museumId', async (req, res) => {
    try {
        const { from, to } = req.body;
        const user = await User.findById(req.session.userId);
        const museumId = req.params.museumId;
        user[from] = user[from].filter(id => id.toString() !== museumId);
        if (!user[to].includes(museumId)) user[to].push(museumId);
        await user.save();
        res.json({ message: "Taşındı." });
    } catch (err) {
        res.status(500).json({ error: "Taşıma başarısız." });
    }
});

app.delete('/api/remove/:museumId/:from', async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        const { from, museumId } = req.params;
        user[from] = user[from].filter(id => id.toString() !== museumId);
        await user.save();
        res.json({ message: "Kaldırıldı." });
    } catch (err) {
        res.status(500).json({ error: "Kaldırma başarısız." });
    }
});