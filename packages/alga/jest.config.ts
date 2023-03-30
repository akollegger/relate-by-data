/* eslint-disable */
export default {
  displayName: 'alga',
  preset: '../../jest.preset.js',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  // coverageDirectory: '../../coverage/packages/alga',
};
