const db = require('./db');

function seed() {
  if (!db.songs.length) {
    const now = Math.floor(Date.now() / 1000);
    const demo = [
      ['夜航星辰', '星夜集', '窗外的风，悄悄吹过...', 215, 'published'],
      ['未命名的歌', '单曲', '歌词待补充', 180, 'published'],
      ['Demo 草稿', '', '', 120, 'draft'],
    ];
    for (const [title, album, lyrics, duration, status] of demo) {
      db.songs.push({
        id: db.nextId('songs'),
        title, album, lyrics, duration,
        filename: '', original_name: '',
        status,
        created_at: now,
      });
    }
    db.persist();
  }

  if (!db.fans.length) {
    const now = Math.floor(Date.now() / 1000);
    const demo = [
      ['小林', '北京', '核心粉', now - 86400 * 30],
      ['Aria', '上海', '白嫖党', now - 86400 * 7],
      ['夜航', '广州', '核心粉,巡演客', now - 86400 * 100],
      ['Kai', '成都', '', now - 86400 * 3],
      ['Momo', '东京', '海外', now - 86400 * 200],
      ['阿哲', '杭州', '白嫖党', now - 86400 * 15],
      ['Leo', '深圳', '核心粉', now - 86400 * 50],
    ];
    for (const [name, region, tags, followed_at] of demo) {
      db.fans.push({
        id: db.nextId('fans'),
        name, region, tags, followed_at,
      });
    }
    db.persist();
  }

  if (!db.announcements.length) {
    db.announcements.push({
      id: db.nextId('announcements'),
      title: '欢迎来到独立音乐管理后台',
      content: '在这里你可以管理歌曲、粉丝与巡演公告。',
      created_at: Math.floor(Date.now() / 1000),
    });
    db.persist();
  }
}

module.exports = seed;

