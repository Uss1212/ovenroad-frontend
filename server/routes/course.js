/* ===================================================
   코스(Course) API 라우터
   - 코스 CRUD (만들기, 조회, 수정, 삭제)
   - 코스 좋아요 / 스크랩
   - COURSES, COURSE_PLACE, COURSE_LIKE, COURSE_SCRAP 테이블 사용
   =================================================== */

const express = require('express');
const pool = require('../db');
const router = express.Router();

/* ── 1) 코스 목록 조회 ── */
/* GET /api/courses */
/* 정렬: ?sort=latest(최신) / popular(인기) / scrap(스크랩 많은 순) */
/* 필터: ?region=마포구 (지역별 필터) */
router.get('/', async (req, res) => {
  try {
    const { sort = 'latest', region } = req.query;

    /* 기본 쿼리: 코스 목록 + 작성자 닉네임 + 좋아요/스크랩 수 */
    let query = `
      SELECT
        c.COURSE_NUM, c.TITLE, c.SUBTITLE, c.CONTENT, c.CREATED_TIME,
        u.NICKNAME AS author,
        u.USER_NUM AS authorNum,
        (SELECT COUNT(*) FROM COURSE_LIKE cl WHERE cl.COURSE_NUM = c.COURSE_NUM) AS likeCount,
        (SELECT COUNT(*) FROM COURSE_SCRAP cs WHERE cs.COURSE_NUM = c.COURSE_NUM) AS scrapCount,
        (SELECT pi.IMAGE_URL FROM COURSE_PLACE cp
         JOIN PLACE_IMAGE pi ON pi.PLACE_NUM = cp.PLACE_NUM
         WHERE cp.COURSE_NUM = c.COURSE_NUM AND cp.IS_THUMBNAIL = 1
         LIMIT 1) AS thumbnailImage
      FROM COURSES c
      JOIN USER u ON u.USER_NUM = c.USER_NUM
    `;

    const params = [];

    /* 지역 필터가 있으면 해당 지역의 장소를 포함한 코스만 */
    if (region) {
      query += `
        WHERE c.COURSE_NUM IN (
          SELECT cp.COURSE_NUM FROM COURSE_PLACE cp
          JOIN PLACES p ON p.PLACE_NUM = cp.PLACE_NUM
          WHERE p.ADDRESS LIKE ?
        )
      `;
      params.push(`%${region}%`);
    }

    /* 정렬 */
    if (sort === 'popular') {
      query += ' ORDER BY likeCount DESC, c.CREATED_TIME DESC';
    } else if (sort === 'scrap') {
      query += ' ORDER BY scrapCount DESC, c.CREATED_TIME DESC';
    } else {
      query += ' ORDER BY c.CREATED_TIME DESC';
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('코스 목록 조회 에러:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/* ── 2) 코스 상세 조회 ── */
/* GET /api/courses/:courseNum */
router.get('/:courseNum', async (req, res) => {
  try {
    const { courseNum } = req.params;

    /* 코스 기본 정보 */
    const [courses] = await pool.query(`
      SELECT
        c.*, u.NICKNAME AS author, u.PROFILE_IMAGE AS authorImage,
        (SELECT COUNT(*) FROM COURSE_LIKE cl WHERE cl.COURSE_NUM = c.COURSE_NUM) AS likeCount,
        (SELECT COUNT(*) FROM COURSE_SCRAP cs WHERE cs.COURSE_NUM = c.COURSE_NUM) AS scrapCount
      FROM COURSES c
      JOIN USER u ON u.USER_NUM = c.USER_NUM
      WHERE c.COURSE_NUM = ?
    `, [courseNum]);

    if (courses.length === 0) {
      return res.status(404).json({ message: '코스를 찾을 수 없습니다.' });
    }

    /* 코스에 포함된 장소 목록 (순서대로) */
    const [places] = await pool.query(`
      SELECT
        cp.PLACE_ORDER, cp.MEMO, cp.IS_THUMBNAIL,
        p.PLACE_NUM, p.PLACE_NAME, p.ADDRESS, p.LATITUDE, p.LONGITUDE,
        (SELECT GROUP_CONCAT(pi.IMAGE_URL) FROM PLACE_IMAGE pi WHERE pi.PLACE_NUM = p.PLACE_NUM) AS images
      FROM COURSE_PLACE cp
      JOIN PLACES p ON p.PLACE_NUM = cp.PLACE_NUM
      WHERE cp.COURSE_NUM = ?
      ORDER BY cp.PLACE_ORDER ASC
    `, [courseNum]);

    res.json({
      ...courses[0],
      places: places,
    });
  } catch (error) {
    console.error('코스 상세 조회 에러:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/* ── 3) 코스 만들기 ── */
/* POST /api/courses */
/* body: { userNum, title, subtitle, content, places: [{ placeNum, order, memo, isThumbnail }] } */
router.post('/', async (req, res) => {
  try {
    const { userNum, title, subtitle, content, places } = req.body;

    if (!userNum || !title || !subtitle) {
      return res.status(400).json({ message: '필수 항목을 입력해주세요.' });
    }

    /* 코스 저장 */
    const [result] = await pool.query(
      'INSERT INTO COURSES (USER_NUM, TITLE, SUBTITLE, CONTENT) VALUES (?, ?, ?, ?)',
      [userNum, title, subtitle, content || null]
    );

    const courseNum = result.insertId;

    /* 코스에 장소 추가 */
    if (places && places.length > 0) {
      const placeValues = places.map(p => [
        p.order, courseNum, p.placeNum, p.memo || null, p.isThumbnail ? 1 : 0
      ]);
      await pool.query(
        'INSERT INTO COURSE_PLACE (PLACE_ORDER, COURSE_NUM, PLACE_NUM, MEMO, IS_THUMBNAIL) VALUES ?',
        [placeValues]
      );
    }

    res.status(201).json({ message: '코스가 생성되었습니다.', courseNum });
  } catch (error) {
    console.error('코스 만들기 에러:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/* ── 4) 코스 수정 ── */
/* PUT /api/courses/:courseNum */
router.put('/:courseNum', async (req, res) => {
  try {
    const { courseNum } = req.params;
    const { title, subtitle, content, places } = req.body;

    /* 코스 정보 수정 */
    await pool.query(
      'UPDATE COURSES SET TITLE = COALESCE(?, TITLE), SUBTITLE = COALESCE(?, SUBTITLE), CONTENT = COALESCE(?, CONTENT) WHERE COURSE_NUM = ?',
      [title, subtitle, content, courseNum]
    );

    /* 장소 정보 변경 (기존 삭제 후 다시 추가) */
    if (places) {
      await pool.query('DELETE FROM COURSE_PLACE WHERE COURSE_NUM = ?', [courseNum]);
      if (places.length > 0) {
        const placeValues = places.map(p => [
          p.order, courseNum, p.placeNum, p.memo || null, p.isThumbnail ? 1 : 0
        ]);
        await pool.query(
          'INSERT INTO COURSE_PLACE (PLACE_ORDER, COURSE_NUM, PLACE_NUM, MEMO, IS_THUMBNAIL) VALUES ?',
          [placeValues]
        );
      }
    }

    res.json({ message: '코스가 수정되었습니다.' });
  } catch (error) {
    console.error('코스 수정 에러:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/* ── 5) 코스 삭제 ── */
/* DELETE /api/courses/:courseNum */
router.delete('/:courseNum', async (req, res) => {
  try {
    const { courseNum } = req.params;
    await pool.query('DELETE FROM COURSES WHERE COURSE_NUM = ?', [courseNum]);
    res.json({ message: '코스가 삭제되었습니다.' });
  } catch (error) {
    console.error('코스 삭제 에러:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/* ── 6) 코스 좋아요 토글 ── */
/* POST /api/courses/:courseNum/like */
/* body: { userNum } */
router.post('/:courseNum/like', async (req, res) => {
  try {
    const { courseNum } = req.params;
    const { userNum } = req.body;

    /* 이미 좋아요 했는지 확인 */
    const [existing] = await pool.query(
      'SELECT * FROM COURSE_LIKE WHERE COURSE_NUM = ? AND USER_NUM = ?',
      [courseNum, userNum]
    );

    if (existing.length > 0) {
      /* 이미 좋아요 → 취소 (삭제) */
      await pool.query('DELETE FROM COURSE_LIKE WHERE COURSE_NUM = ? AND USER_NUM = ?', [courseNum, userNum]);
      res.json({ message: '좋아요가 취소되었습니다.', liked: false });
    } else {
      /* 좋아요 안 함 → 추가 */
      await pool.query('INSERT INTO COURSE_LIKE (COURSE_NUM, USER_NUM) VALUES (?, ?)', [courseNum, userNum]);
      res.json({ message: '좋아요를 눌렀습니다.', liked: true });
    }
  } catch (error) {
    console.error('좋아요 에러:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/* ── 7) 코스 스크랩 토글 ── */
/* POST /api/courses/:courseNum/scrap */
/* body: { userNum } */
router.post('/:courseNum/scrap', async (req, res) => {
  try {
    const { courseNum } = req.params;
    const { userNum } = req.body;

    const [existing] = await pool.query(
      'SELECT * FROM COURSE_SCRAP WHERE COURSE_NUM = ? AND USER_NUM = ?',
      [courseNum, userNum]
    );

    if (existing.length > 0) {
      await pool.query('DELETE FROM COURSE_SCRAP WHERE COURSE_NUM = ? AND USER_NUM = ?', [courseNum, userNum]);
      res.json({ message: '스크랩이 취소되었습니다.', scraped: false });
    } else {
      await pool.query('INSERT INTO COURSE_SCRAP (COURSE_NUM, USER_NUM) VALUES (?, ?)', [courseNum, userNum]);
      res.json({ message: '스크랩했습니다.', scraped: true });
    }
  } catch (error) {
    console.error('스크랩 에러:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
