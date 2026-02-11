require('dotenv').config();

const express = require('express');
const http = require('http');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const mongoose = require('mongoose');


const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(helmet());

const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000'];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use('/todo', todoRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error('🔥 에러 발생');
  console.error('URL:', req.method, req.originalUrl);
  console.error('에러 메시지:', err.message);
  console.error('전체 에러:', err);

  res.status(500).json({
    message: err.message || 'Internal Server Error',
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB 연결 성공');

    server.listen(PORT, () => {
      console.log(`listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB 연결 실패:', err);
  });

module.exports = app;
