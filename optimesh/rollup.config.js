export default {
  input: 'src/main.js',
  external: ['dvlp-three'],
  // sourceMap: true,
  output: [
    {
      format: 'iife',
      name: 'optimesh',
      file: 'build/main.js',
      indent: '\t',
      banner: 'var dvlpThree = dvlpThree || THREE;',
      external: ['dvlp-three']
    },
    {
      format: 'es',
      file: 'build/main.module.js',
      indent: '\t',
      banner: 'var dvlpThree = dvlpThree || THREE;',
      external: ['dvlp-three']
    }
  ]
};
