/* ===================================================
   사용자(User) API 라우터
   - 회원가입, 로그인, 아이디/닉네임 중복확인
   - 이메일 인증, 회원정보 조회/수정
   - USER 테이블 사용
   =================================================== */

const express = require('express');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer'); /* 이메일 보내주는 도구 */
const pool = require('../db');

/* --- Gmail로 이메일 보내는 도구 설정 --- */
/* transporter: 우체부 같은 역할 (Gmail 우체국을 통해 편지를 보냄) */
const transporter = nodemailer.createTransport({
  service: 'gmail',        /* Gmail 우체국 사용 */
  auth: {
    user: 'qmflxltnl33@gmail.com',   /* 보내는 사람 이메일 주소 */
    pass: 'nshw nzxx mqln vdex',      /* Gmail 앱 비밀번호 (일반 비밀번호 아님!) */
  },
});

/* --- 라우터 만들기 --- */
/* 라우터: 비슷한 종류의 API를 하나로 묶어주는 도구 */
const router = express.Router();

/* --- 이메일 인증코드 임시 저장소 --- */
/* 나중에 Redis 같은 것으로 교체 예정 */
const emailCodes = {};

/* ── 1) 회원가입 ── */
/* POST /api/user/signup */
router.post('/signup', async (req, res) => {
  try {
    const { id, password, name, nickname, email } = req.body;

    /* 필수값 확인 */
    if (!id || !password || !name || !nickname || !email) {
      return res.status(400).json({ message: '모든 항목을 입력해주세요.' });
    }

    /* 아이디 중복 확인 */
    const [existingId] = await pool.query('SELECT USER_NUM FROM USER WHERE ID = ?', [id]);
    if (existingId.length > 0) {
      return res.status(409).json({ message: '이미 사용 중인 아이디입니다.' });
    }

    /* 닉네임 중복 확인 */
    const [existingNickname] = await pool.query('SELECT USER_NUM FROM USER WHERE NICKNAME = ?', [nickname]);
    if (existingNickname.length > 0) {
      return res.status(409).json({ message: '이미 사용 중인 닉네임입니다.' });
    }

    /* 이메일 중복 확인 */
    const [existingEmail] = await pool.query('SELECT USER_NUM FROM USER WHERE EMAIL = ?', [email]);
    if (existingEmail.length > 0) {
      return res.status(409).json({ message: '이미 가입된 이메일입니다.' });
    }

    /* 비밀번호 암호화 */
    const hashedPassword = await bcrypt.hash(password, 10);

    /* DB에 새 회원 저장 */
    const [result] = await pool.query(
      'INSERT INTO USER (ID, USER_PW, NAME, NICKNAME, EMAIL) VALUES (?, ?, ?, ?, ?)',
      [id, hashedPassword, name, nickname, email]
    );

    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      userNum: result.insertId,
    });
  } catch (error) {
    console.error('회원가입 에러:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/* ── 2) 로그인 ── */
/* POST /api/user/login */
/* 이메일 주소 = 아이디! 이메일로 로그인 */
router.post('/login', async (req, res) => {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
    }

    /* DB에서 사용자 찾기 (이메일 = 아이디) */
    const [rows] = await pool.query('SELECT * FROM USER WHERE EMAIL = ?', [id]);
    if (rows.length === 0) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const user = rows[0];

    /* 비밀번호 비교 */
    const isMatch = await bcrypt.compare(password, user.USER_PW);
    if (!isMatch) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    /* 로그인 성공 → 비밀번호 빼고 응답 */
    res.json({
      message: '로그인 성공',
      user: {
        userNum: user.USER_NUM,
        id: user.ID,
        name: user.NAME,
        nickname: user.NICKNAME,
        email: user.EMAIL,
        grade: user.GRADE,
        profileImage: user.PROFILE_IMAGE,
      },
    });
  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/* ── 3) 아이디 중복확인 ── */
/* GET /api/user/check-id?id=xxx */
router.get('/check-id', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: '아이디를 입력해주세요.' });

    const [rows] = await pool.query('SELECT USER_NUM FROM USER WHERE ID = ?', [id]);
    if (rows.length > 0) {
      return res.status(409).json({ message: '이미 사용 중인 아이디입니다.', available: false });
    }
    res.json({ message: '사용 가능한 아이디입니다.', available: true });
  } catch (error) {
    console.error('아이디 중복확인 에러:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/* ── 4) 닉네임 중복확인 ── */
/* GET /api/user/check-nickname?nickname=xxx */
router.get('/check-nickname', async (req, res) => {
  try {
    const { nickname } = req.query;
    if (!nickname) return res.status(400).json({ message: '닉네임을 입력해주세요.' });

    const [rows] = await pool.query('SELECT USER_NUM FROM USER WHERE NICKNAME = ?', [nickname]);
    if (rows.length > 0) {
      return res.status(409).json({ message: '이미 사용 중인 닉네임입니다.', available: false });
    }
    res.json({ message: '사용 가능한 닉네임입니다.', available: true });
  } catch (error) {
    console.error('닉네임 중복확인 에러:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/* ── 5) 이메일 인증코드 전송 (Gmail SMTP) ── */
/* POST /api/user/send-email */
/* 사용자가 입력한 이메일 주소로 6자리 인증코드를 실제로 보냄 */
router.post('/send-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: '이메일을 입력해주세요.' });

    /* 6자리 랜덤 인증코드 생성 (100000 ~ 999999) */
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    /* 인증코드를 메모리에 저장 (나중에 확인할 때 비교용) */
    emailCodes[email] = code;

    /* 실제 이메일 보내기! */
    /* transporter.sendMail() = 우체부에게 "이 편지 보내줘!" 하는 것 */
    await transporter.sendMail({
      from: '"오븐로드" <qmflxltnl33@gmail.com>',  /* 보내는 사람 (오븐로드 이름으로) */
      to: email,                                      /* 받는 사람 (사용자가 입력한 이메일) */
      subject: '[오븐로드] 이메일 인증코드',            /* 이메일 제목 */
      html: `
        <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #b45309; text-align: center;">🍞 오븐로드 이메일 인증</h2>
          <p style="color: #374151; font-size: 16px; text-align: center;">
            아래 인증코드를 회원가입 페이지에 입력해주세요.
          </p>
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #92400e; letter-spacing: 8px;">${code}</span>
          </div>
          <p style="color: #6b7280; font-size: 13px; text-align: center;">
            본인이 요청하지 않았다면 이 이메일을 무시해주세요.
          </p>
        </div>
      `,
    });

    console.log(`[이메일 인증] ${email} → 인증코드 전송 완료`);
    res.json({ message: '인증코드가 전송되었습니다.' });
  } catch (error) {
    console.error('이메일 전송 에러:', error);
    res.status(500).json({ message: '이메일 전송에 실패했습니다. 이메일 주소를 확인해주세요.' });
  }
});

/* ── 6) 이메일 인증코드 확인 ── */
/* POST /api/user/verify-email */
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: '이메일과 인증코드를 입력해주세요.' });

    if (emailCodes[email] === code) {
      delete emailCodes[email];
      res.json({ message: '이메일 인증이 완료되었습니다.', verified: true });
    } else {
      res.status(400).json({ message: '인증코드가 일치하지 않습니다.', verified: false });
    }
  } catch (error) {
    console.error('인증코드 확인 에러:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/* ── 7) 회원정보 조회 ── */
/* GET /api/user/:userNum */
router.get('/:userNum', async (req, res) => {
  try {
    const { userNum } = req.params;
    const [rows] = await pool.query(
      'SELECT USER_NUM, ID, NAME, NICKNAME, EMAIL, GRADE, PROFILE_IMAGE FROM USER WHERE USER_NUM = ?',
      [userNum]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('회원정보 조회 에러:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/* ── 8) 회원정보 수정 ── */
/* PUT /api/user/:userNum */
router.put('/:userNum', async (req, res) => {
  try {
    const { userNum } = req.params;
    const { nickname, email, profileImage } = req.body;

    await pool.query(
      'UPDATE USER SET NICKNAME = COALESCE(?, NICKNAME), EMAIL = COALESCE(?, EMAIL), PROFILE_IMAGE = COALESCE(?, PROFILE_IMAGE) WHERE USER_NUM = ?',
      [nickname, email, profileImage, userNum]
    );

    res.json({ message: '회원정보가 수정되었습니다.' });
  } catch (error) {
    console.error('회원정보 수정 에러:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/* ── 9) 비밀번호 변경 ── */
/* PUT /api/user/:userNum/password */
/* 현재 비밀번호를 확인한 후, 새 비밀번호로 변경 */
router.put('/:userNum/password', async (req, res) => {
  try {
    const { userNum } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: '현재 비밀번호와 새 비밀번호를 입력해주세요.' });
    }

    /* DB에서 사용자 찾기 */
    const [rows] = await pool.query('SELECT USER_PW FROM USER WHERE USER_NUM = ?', [userNum]);
    if (rows.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    /* 현재 비밀번호가 맞는지 확인 */
    const isMatch = await bcrypt.compare(currentPassword, rows[0].USER_PW);
    if (!isMatch) {
      return res.status(401).json({ message: '현재 비밀번호가 올바르지 않습니다.' });
    }

    /* 새 비밀번호 암호화 후 저장 */
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE USER SET USER_PW = ? WHERE USER_NUM = ?', [hashedPassword, userNum]);

    res.json({ message: '비밀번호가 변경되었습니다.' });
  } catch (error) {
    console.error('비밀번호 변경 에러:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/* ── 10) 회원탈퇴 ── */
/* DELETE /api/user/:userNum */
/* 비밀번호를 확인한 후, 사용자 정보를 DB에서 삭제 */
router.delete('/:userNum', async (req, res) => {
  try {
    const { userNum } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
    }

    /* DB에서 사용자 찾기 */
    const [rows] = await pool.query('SELECT USER_PW FROM USER WHERE USER_NUM = ?', [userNum]);
    if (rows.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    /* 비밀번호 확인 */
    const isMatch = await bcrypt.compare(password, rows[0].USER_PW);
    if (!isMatch) {
      return res.status(401).json({ message: '비밀번호가 올바르지 않습니다.' });
    }

    /* 사용자 삭제 */
    await pool.query('DELETE FROM USER WHERE USER_NUM = ?', [userNum]);

    res.json({ message: '회원탈퇴가 완료되었습니다.' });
  } catch (error) {
    console.error('회원탈퇴 에러:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
