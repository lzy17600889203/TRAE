const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const { knuthPlass, measureText } = require('./knuth-plass');
const { applyLigatures, processArabic, applyOpticalMarginAlignment, detectRiverEffect, detectOverflow, detectLigatureIssues, detectArabicConnectionIssues, isArabicChar } = require('./typography');
const { getAllPresets, getPresetByName } = require('./database');

fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
});

fastify.get('/api/presets', async (request, reply) => {
  try {
    const presets = getAllPresets.all();
    return { success: true, data: presets };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

fastify.get('/api/presets/:name', async (request, reply) => {
  try {
    const preset = getPresetByName.get(request.params.name);
    if (!preset) {
      reply.code(404);
      return { success: false, error: '预设不存在' };
    }
    return { success: true, data: preset };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

fastify.post('/api/typeset', async (request, reply) => {
  try {
    const { text, options } = request.body;
    
    if (!text) {
      reply.code(400);
      return { success: false, error: '文本不能为空' };
    }
    
    const defaultOptions = {
      columnWidth: 400,
      wordSpacing: 1.0,
      letterSpacing: 0,
      hyphenationRules: 'normal',
      ligatureMode: 'normal',
      fontSize: 16,
      tolerance: 200,
      arabicBreakConnections: false,
      opticalMarginAlignment: true
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    let processedText = text;
    
    processedText = processArabic(processedText, mergedOptions.arabicBreakConnections);
    
    if (mergedOptions.ligatureMode === 'conflict') {
      processedText = applyLigatures(processedText, 'conflict');
    } else {
      processedText = applyLigatures(processedText, mergedOptions.ligatureMode);
    }
    
    const lines = knuthPlass(processedText, mergedOptions);
    
    const finalLines = mergedOptions.opticalMarginAlignment 
      ? applyOpticalMarginAlignment(lines, mergedOptions)
      : lines;
    
    const riverIssues = detectRiverEffect(finalLines, mergedOptions.columnWidth);
    const overflowIssues = detectOverflow(finalLines, mergedOptions.columnWidth);
    const ligatureIssues = detectLigatureIssues(processedText);
    const arabicIssues = detectArabicConnectionIssues(processedText);
    
    const totalDemerits = finalLines.reduce((sum, line) => {
      const badness = Math.pow(Math.abs(line.adjustRatio || 0), 3) * 100;
      return sum + badness;
    }, 0);
    
    return {
      success: true,
      data: {
        lines: finalLines,
        totalDemerits,
        issues: [...riverIssues, ...overflowIssues, ...ligatureIssues, ...arabicIssues],
        columnWidth: mergedOptions.columnWidth,
        options: mergedOptions
      }
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500);
    return { success: false, error: error.message };
  }
});

fastify.post('/api/measure', async (request, reply) => {
  try {
    const { text, fontSize, letterSpacing } = request.body;
    const width = measureText(text, fontSize || 16, letterSpacing || 0);
    return { success: true, data: { width } };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('排版服务已启动: http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
