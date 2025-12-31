module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        graphite: '#343130',
        pitchBlack: '#0C0805',
        vanillaCustard: '#D1DA9C',
        powderBlush: '#F7A3A1',
        paleAmber: '#D2DC76',
        // Additional tag colors
        lavenderMist: '#E6E6FA',
        skyBlue: '#87CEEB',
        mintGreen: '#98FF98',
        coralPink: '#F88379',
        periwinkle: '#CCCCFF',
        peach: '#FFDAB9',
        sage: '#B2AC88',
        rose: '#E8B4B8',
        teal: '#94D3D2',
        mauve: '#E0B0FF'
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
