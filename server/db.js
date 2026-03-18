/* ===================================================
   MySQL 데이터베이스 연결 설정
   - 여러 파일에서 같은 DB 연결을 공유하기 위해 따로 분리
   - pool(풀): 여러 개의 DB 연결을 미리 만들어놓고 재사용
   =================================================== */

const mysql = require('mysql2/promise');

/* --- MySQL 연결 풀 만들기 --- */
const pool = mysql.createPool({
  host: 'localhost',      /* DB 서버 주소 (내 컴퓨터) */
  port: 3306,             /* MySQL 기본 포트 */
  user: 'root',           /* DB 사용자 이름 */
  password: '3155',       /* DB 비밀번호 */
  database: 'ovenroad',   /* 사용할 데이터베이스 이름 */
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
