const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
  const { id, password } = req.body;

  if (!id || !password) {
    return res
      .status(400)
      .json({ message: '아이디와 비밀번호를 입력해주세요' });
  }

  if (id !== process.env.ADMIN_ID) {
    return res.status(401).json({ message: '계정이 없습니다' });
  }

  try {
    const isMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD);

    if (!isMatch) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다' });
    }

    const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    });

    return res.json({ accessToken, refreshToken });
  } catch (error) {
    return res.status(500).json({ message: '서버 내부 오류가 발생했습니다' });
  }
};

exports.refresh = (req, res) => {
  const refreshToken = req.headers.authorization?.split(' ')[1];

  if (!refreshToken) {
    return res.status(400).json({ message: '리프레시 토큰이 필요합니다' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const accessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    return res.json({ accessToken });
  } catch (error) {
    return res
      .status(403)
      .json({ message: '리프레시 토큰이 유효하지 않거나 만료되었습니다' });
  }
};
