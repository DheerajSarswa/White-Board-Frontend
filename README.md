# White Board - Drawing Application

A modern, interactive digital whiteboard application built with React and Vite. Create sketches, diagrams, and drawings with an intuitive interface and smooth drawing experience.

## 🎨 Features

- **Drawing Tools**
  - **Brush** - Freehand drawing with customizable stroke color and size
  - **Line** - Draw straight lines with adjustable stroke properties
  - **Rectangle** - Create rectangles with stroke and fill options
  - **Circle** - Draw circles with customizable appearance
  - **Arrow** - Draw directional arrows
  - **Text** - Add text annotations to your drawings
  - **Eraser** - Remove elements from the canvas

- **Customization Options**
  - **Stroke Color Picker** - Choose from preset colors or use custom color picker
  - **Fill Color** - Fill shapes with colors (rectangles and circles)
  - **Brush Size** - Adjust the thickness for drawing and eraser tools

- **User Actions**
  - **Undo/Redo** - Keyboard shortcuts (Ctrl+Z/Cmd+Z for undo, Ctrl+Shift+Z/Cmd+Shift+Z for redo)
  - **Download** - Export your drawing as a PNG image with white background

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Navigate to the project directory
cd white-board

# Install dependencies
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## 🛠️ Project Structure

```
white-board/
├── src/
│   ├── components/
│   │   ├── Board/           # Main canvas component
│   │   ├── Toolbar/         # Tool selection and action buttons
│   │   └── Toolbox/         # Tool customization (colors, sizes)
│   ├── store/
│   │   ├── board-context.jsx    # Board state management
│   │   ├── BoardProvider.jsx    # Board state provider
│   │   ├── toolbox-context.jsx  # Toolbox state management
│   │   └── ToolboxProvider.jsx  # Toolbox state provider
│   ├── utils/
│   │   ├── element.jsx      # Drawing element utilities
│   │   └── math.jsx         # Mathematical calculations for shapes
│   ├── App.jsx              # Main application component
│   ├── constants.jsx        # Application constants
│   ├── main.jsx             # Application entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── package.json             # Project dependencies
├── vite.config.js           # Vite configuration
├── eslint.config.js         # ESLint configuration
└── README.md               # This file
```

## 🎯 How to Use

1. **Select a Tool** - Click on a tool icon in the toolbar at the top
2. **Customize** - Adjust stroke color, fill color, or brush size in the toolbox (right side)
3. **Draw** - Click and drag on the canvas to create drawings
4. **Edit** - Use undo/redo buttons or keyboard shortcuts to edit
5. **Export** - Click the download button to save your drawing as PNG

## 🔧 Tech Stack

- **Frontend Framework** - React 19.2.4
- **Build Tool** - Vite 7.3.1
- **Styling** - Tailwind CSS 4.2.1
- **Drawing Engine** - Rough.js 4.6.6 (for hand-drawn quality)
- **Smooth Drawing** - Perfect Freehand 1.2.3
- **Icons** - React Icons 5.6.0
- **Code Quality** - ESLint 9.39.4

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint checks

## 🎨 Available Colors

- Black (#000000)
- Red (#ff0000)
- Green (#00ff00)
- Blue (#0000ff)
- Orange (#ffa500)
- Yellow (#ffff00)
- White (#ffffff)

## 🎮 Keyboard Shortcuts

| Action | Shortcut                                             |
| ------ | ---------------------------------------------------- |
| Undo   | `Ctrl+Z` (Windows/Linux) / `Cmd+Z` (Mac)             |
| Redo   | `Ctrl+Shift+Z` (Windows/Linux) / `Cmd+Shift+Z` (Mac) |

## 🔄 State Management

The application uses React Context API for state management:

- **BoardProvider** - Manages canvas elements, active tool, and drawing actions
- **ToolboxProvider** - Manages tool customization settings (colors, sizes)

## 📝 Notes

- The application uses HTML Canvas API for rendering
- Rough.js is used to create the hand-drawn aesthetic
- Perfect Freehand provides smooth drawing paths
- State updates trigger canvas re-renders to display changes

---

**Enjoy creating on the whiteboard! 🎨**
