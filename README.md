# MMM-DailyMetArt

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MagicMirror² Module](https://img.shields.io/badge/MagicMirror²-Module-blue.svg)](https://magicmirror.builders/)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/ercan-ermis/MMM-DailyMetArt)

A beautiful MagicMirror² module that displays daily artwork from The Metropolitan Museum of Art's public collection. Transform your mirror into a digital art gallery that showcases masterpieces from one of the world's most prestigious museums.

## ✨ Features

- **🎨 Daily Artwork**: Automatically fetches and displays a new piece of art each day
- **🖼️ High-Quality Images**: Shows artwork from The Met's public domain collection
- **📱 Responsive Design**: Flexible layout options for different screen sizes
- **⚙️ Highly Customizable**: Extensive configuration options for appearance and behavior
- **🔄 Smart Caching**: Efficient API usage with intelligent caching and rate limiting
- **🌅 Midnight Refresh**: Automatically updates at midnight for a fresh daily experience
- **📊 Rich Metadata**: Displays artwork title, artist, date, medium, and more

## 🚀 Installation

1. Navigate to your MagicMirror² modules directory:
   ```bash
   cd ~/MagicMirror/modules
   ```

2. Clone this repository:
   ```bash
   git clone https://github.com/flightlesstux/MMM-DailyMetArt.git
   ```

3. Install dependencies:
   ```bash
   cd MMM-DailyMetArt
   npm install
   ```

4. Add the module to your `config/config.js` file:
   ```javascript
   {
     module: "MMM-DailyMetArt",
     position: "bottom_left",
     config: {
       // See configuration options below
     }
   }
   ```

## ⚙️ Configuration

### Basic Configuration

```javascript
{
  module: "MMM-DailyMetArt",
  position: "bottom_left",
  config: {
    // Update frequency (default: 12 hours)
    updateInterval: 12 * 60 * 60 * 1000,
    
    // Initial load delay (default: 3 seconds)
    initialLoadDelay: 3000,
    
    // Refresh at midnight (default: true)
    refreshAtMidnight: true,
    
    // Rate limiting (default: 2 calls per hour)
    maxCallsPerHour: 2
  }
}
```

### Layout Configuration

```javascript
config: {
  // Text position relative to image
  textPosition: "right",  // "left" | "right" | "top" | "bottom"
  
  // Image sizing
  imageMaxWidth: "420px",
  
  // Text alignment
  textAlign: "left"  // "left" | "center" | "right"
}
```

### Display Options

```javascript
config: {
  // Show/hide elements
  showTitle: true,        // Artwork title
  showArtist: true,       // Artist name
  showDate: true,         // Creation date
  showMedium: true,       // Art medium/material
  showDepartment: false,  // Museum department
  showCredit: false,      // Credit line
  showAttribution: true   // "Image & data: The Met" attribution
}
```

### Styling Options

```javascript
config: {
  // Font sizes
  titleFontSize: "18px",
  bodyFontSize: "14px",
  attribFontSize: "11px",
  
  // Colors
  titleColor: "#fff",
  bodyColor: "#ddd",
  attribColor: "rgba(255,255,255,0.7)"
}
```

### Complete Configuration Example

```javascript
{
  module: "MMM-DailyMetArt",
  position: "bottom_left",
  config: {
    // Update settings
    updateInterval: 6 * 60 * 60 * 1000,  // 6 hours
    initialLoadDelay: 2000,
    refreshAtMidnight: true,
    maxCallsPerHour: 4,
    
    // Layout
    textPosition: "bottom",
    imageMaxWidth: "500px",
    textAlign: "center",
    
    // Display options
    showTitle: true,
    showArtist: true,
    showDate: true,
    showMedium: true,
    showDepartment: false,
    showCredit: false,
    showAttribution: true,
    
    // Styling
    titleFontSize: "20px",
    titleColor: "#ffffff",
    bodyFontSize: "16px",
    bodyColor: "#e0e0e0",
    attribFontSize: "12px",
    attribColor: "rgba(255,255,255,0.6)"
  }
}
```

## 🎨 Layout Options

The module supports four different layout configurations:

- **`textPosition: "right"`** (default): Image on the left, text on the right
- **`textPosition: "left"`**: Text on the left, image on the right  
- **`textPosition: "top"`**: Text above the image
- **`textPosition: "bottom"`**: Image above the text

## 🔧 Technical Details

### API Integration

This module integrates with The Metropolitan Museum of Art's [Collection API](https://metmuseum.github.io/), specifically:
- **Search Endpoint**: `/public/collection/v1/search`
- **Object Details**: `/public/collection/v1/objects/{id}`

### Rate Limiting

The module includes built-in rate limiting to respect API guidelines:
- Default: Maximum 2 calls per hour
- Configurable via `maxCallsPerHour` setting
- Automatic interval adjustment to prevent excessive API usage

### Caching Strategy

- **Daily Caching**: Artwork is cached per day using a date-based seed
- **Efficient Updates**: Only fetches new data when the date changes
- **Memory Management**: Automatic cache cleanup

### Error Handling

- Graceful fallback for API failures
- User-friendly error messages
- Automatic retry mechanisms
- Network timeout protection (15 seconds)

## 🛠️ Development

### Prerequisites

- Node.js (v14 or higher)
- MagicMirror² installation
- npm or yarn package manager

### Dependencies

- `node-fetch`: HTTP client for API requests
- MagicMirror² core framework

### Building from Source

```bash
# Clone the repository
git clone https://github.com/flightlesstux/MMM-DailyMetArt.git
cd MMM-DailyMetArt

# Install dependencies
npm install

# The module is ready to use!
```

### Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow existing code formatting
- Use meaningful variable names
- Add comments for complex logic
- Test your changes thoroughly

## 📋 Requirements

- **MagicMirror²**: v2.0.0 or higher
- **Node.js**: v14.0.0 or higher
- **Internet Connection**: Required for API access

## 🐛 Troubleshooting

### Common Issues

**Module not loading:**
- Check that all dependencies are installed (`npm install`)
- Verify the module path in your config
- Check MagicMirror² logs for error messages

**No artwork displaying:**
- Ensure internet connection is working
- Check API rate limits (try reducing `maxCallsPerHour`)
- Verify The Met API is accessible

**Layout issues:**
- Adjust `imageMaxWidth` for your screen size
- Try different `textPosition` values
- Check CSS conflicts with other modules

### Debug Mode

Enable debug logging by adding to your config:
```javascript
config: {
  debug: true,
  // ... other options
}
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **The Metropolitan Museum of Art** for providing the amazing Collection API
- **MagicMirror² Community** for the excellent framework
- **Open Source Contributors** who make projects like this possible

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/flightlesstux/MMM-DailyMetArt/issues)
- **Discussions**: [GitHub Discussions](https://github.com/flightlesstux/MMM-DailyMetArt/discussions)
- **MagicMirror² Forum**: [Community Forum](https://forum.magicmirror.builders/)

## 🔗 Related Projects

- [MagicMirror²](https://github.com/MichMich/MagicMirror) - The main framework
- [The Met Collection API](https://metmuseum.github.io/) - Art data source

---

<div align="center">

**Developed with ❤️ and passion for art and technology in the 🇳🇱.**

*Bringing the beauty of The Metropolitan Museum of Art to your MagicMirror²*

[⭐ Star this repo](https://github.com/flightlesstux/MMM-DailyMetArt) | [🐛 Report Bug](https://github.com/ercan-ermis/MMM-DailyMetArt/issues) | [💡 Request Feature](https://github.com/ercan-ermis/MMM-DailyMetArt/issues)

</div>
