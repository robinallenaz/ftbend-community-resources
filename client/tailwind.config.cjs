module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        graphite: '#343130',
        pitchBlack: '#0C0805',
        vanillaCustard: '#D1DA9C',
        powderBlush: '#F7A3A1',
        paleAmber: '#D2DC76'
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px'
      },
      boxShadow: {
        soft: '0 10px 35px rgba(0,0,0,0.35)'
      }
    }
  },
  plugins: []
};
