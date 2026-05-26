const { applyLigatures, processArabic, isArabicChar } = require('./src/typography');

console.log('=== 验证阿拉伯文修复 ===\n');

const testCases = [
  {
    name: '阿拉伯文句子',
    text: 'لكتابة النصوص العربية بشكل صحيح'
  },
  {
    name: '含 fi 的英文单词',
    text: 'The quick brown fox finds it difficult to fly'
  },
  {
    name: '混合文本',
    text: 'Hello في world كتابة'
  }
];

testCases.forEach(test => {
  console.log(`测试: ${test.name}`);
  console.log(`原始: ${test.text}`);
  
  const arabicProcessed = processArabic(test.text, false);
  console.log(`阿拉伯文处理后: ${arabicProcessed}`);
  
  const ligatureApplied = applyLigatures(arabicProcessed, 'normal');
  console.log(`连字应用后: ${ligatureApplied}`);
  
  const hasArabicChars = test.text.split('').some(isArabicChar);
  console.log(`包含阿拉伯字符: ${hasArabicChars}`);
  console.log('---');
});

console.log('\n=== 验证 Lam-Alef 连字 ===');
const lamAlefTest = 'لا لآ لأ لإ';
console.log(`原始: ${lamAlefTest}`);
console.log(`处理后: ${processArabic(lamAlefTest, false)}`);

console.log('\n=== 验证连字不影响阿拉伯文 ===');
const arabicWithFi = 'في نفس الوقت';
console.log(`原始: ${arabicWithFi}`);
console.log(`阿拉伯文处理: ${processArabic(arabicWithFi, false)}`);
console.log(`连字应用: ${applyLigatures(processArabic(arabicWithFi, false), 'aggressive')}`);
