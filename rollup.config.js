import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

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
      banner: 'var dvlpThree = (typeof dvlpThree !== \'undefined\' && dvlpThree) || (typeof dvlpThree$1 !== \'undefined\' && dvlpThree$1) || (typeof THREE !== \'undefined\' && THREE);',
      external: ['dvlp-three', 'dvlpThree'],
      globals: ['dvlp-three', 'dvlpThree']
    },
    {
      format: 'es',
      file: 'build/main.module.js',
      indent: '\t',
      banner: 'import * as dvlpThree from \'dvlp-three\';',
      external: ['dvlp-three'],
    }
  ],
  plugins    : [
    commonjs({
      // non-CommonJS modules will be ignored, but you can also
      // specifically include/exclude files
      include: [ './index.js', 'node_modules/**' ], // Default: undefined

      // if true then uses of `global` won't be dealt with by this plugin
      ignoreGlobal: false, // Default: false

      // if false then skip sourceMap generation for CommonJS modules
      sourceMap: false // Default: true
    }),

    nodeResolve({
      jsnext: true,
      main: false
    })
  ]
};
