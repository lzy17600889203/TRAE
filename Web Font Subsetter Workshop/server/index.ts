import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import cors from '@fastify/cors';
import { uploadFont, getFontInfo, allFonts, processFont, allTasks, taskDetail, taskOutput } from './services.js';

const fastify = Fastify({
  logger: true,
  bodyLimit: 30 * 1024 * 1024,
});

fastify.register(cors, { origin: true });
fastify.register(multipart, {
  limits: {
    fileSize: 20 * 1024 * 1024,
    fieldSize: 20 * 1024 * 1024,
  },
});

fastify.post('/api/upload', async (req, reply) => {
  try {
    const file = await req.file();
    if (!file) return reply.status(400).send({ error: 'NO_FILE' });

    const buffers: Buffer[] = [];
    let totalSize = 0;
    for await (const chunk of file.file) {
      const buf = chunk as Buffer;
      totalSize += buf.length;
      if (totalSize > 20 * 1024 * 1024) {
        return reply.status(413).send({ error: 'FILE_TOO_LARGE' });
      }
      buffers.push(buf);
    }

    if (buffers.length === 0) {
      return reply.status(400).send({ error: 'EMPTY_FILE' });
    }

    const buffer = Buffer.concat(buffers);
    const info = await uploadFont(buffer, file.filename);
    return info;
  } catch (e: any) {
    fastify.log.error(e, 'Upload failed');
    return reply.status(500).send({
      error: 'UPLOAD_FAILED',
      message: e.message || '文件处理失败',
    });
  }
});

fastify.get('/api/fonts', async () => allFonts());

fastify.get('/api/fonts/:id', async (req: any, reply) => {
  try {
    const info = getFontInfo(req.params.id);
    if (!info) return reply.status(404).send({ error: 'NOT_FOUND' });
    return info;
  } catch (e: any) {
    return reply.status(500).send({ error: 'QUERY_FAILED', message: e.message });
  }
});

fastify.post('/api/fonts/:id/process', async (req: any, reply) => {
  const body = req.body as any;
  try {
    const taskId = await processFont(req.params.id, {
      charset: body.charset || '',
      algorithm: body.algorithm || 'subset',
      checksum: body.checksum !== false,
      preset: body.preset,
    });
    return { taskId };
  } catch (e: any) {
    return reply.status(400).send({ error: e.message });
  }
});

fastify.get('/api/tasks', async () => allTasks());

fastify.get('/api/tasks/:id', async (req: any, reply) => {
  try {
    const t = taskDetail(req.params.id);
    if (!t) return reply.status(404).send({ error: 'NOT_FOUND' });
    return t;
  } catch (e: any) {
    return reply.status(500).send({ error: 'QUERY_FAILED' });
  }
});

fastify.get('/api/tasks/:id/download', async (req: any, reply) => {
  try {
    const out = taskOutput(req.params.id);
    if (!out) return reply.status(404).send({ error: 'NO_OUTPUT' });
    reply.header('Content-Type', 'font/ttf');
    reply.header('Content-Disposition', `attachment; filename="${out.fontName}"`);
    return out.data;
  } catch (e: any) {
    return reply.status(500).send({ error: 'DOWNLOAD_FAILED' });
  }
});

fastify.get('/api/presets', async () => [
  { id: 'cn', name: '中文字体精简场景', color: '#00ffa3', charset: '你好世界字体子集中文精简示例' },
  { id: 'icon', name: '图标字体提取场景', color: '#ff8a00', charset: '☠★❤♠♣✓✗✎✏✐✂' },
  { id: 'corrupt', name: '损坏字体文件场景', color: '#ff2d6e', charset: 'abcdef12345' },
  { id: 'merge', name: '多字体合并场景', color: '#7c5cff', charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
]);

const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: '0.0.0.0' });
    console.log('API listening on http://localhost:4000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
