// favicon-generator.js
const favicons = require('favicons');
const fs = require('fs');
const path = require('path');

const source = path.resolve(__dirname, 'public', 'logo.svg');
const outputDir = path.resolve(__dirname, 'public');

// Configuration
const configuration = {
  path: "/",
  appName: "Korntewin Portfolio",
  appShortName: "Korn",
  appDescription: "Korntewin's Personal Portfolio Website",
  developerName: "Korntewin",
  developerURL: null,
  icons: {
    android: false, // Android homescreen icon
    appleIcon: true, // Apple touch icons
    appleStartup: false,  // Apple startup images
    coast: false,
    favicons: true, // Regular favicons
    firefox: false, // Firefox OS icons
    windows: false, // Windows 8 tile icons
    yandex: false  // Yandex browser icon
  }
};

// Generate favicons
console.log('Generating favicon...');
favicons(source, configuration)
  .then(response => {
    // Create files
    console.log('Saving favicon files...');
    response.images.forEach(image => {
      fs.writeFileSync(
        path.join(outputDir, image.name),
        image.contents
      );
    });
    console.log('Favicon generation complete!');
  })
  .catch(error => {
    console.error('Error generating favicons:', error);
  });
