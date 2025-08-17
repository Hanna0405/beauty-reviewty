# Beauty Masters Directory

A modern, responsive Next.js application for discovering and connecting with beauty professionals. Built with TypeScript, Tailwind CSS, and Next.js 14.

## Features

- 🏠 **Homepage** with hero section, featured masters, and service overview
- 👥 **Masters Directory** with responsive grid layout
- 🔍 **Search & Filters** - search by name, services, or description; filter by city and service type
- 👤 **Individual Master Profiles** with detailed information
- 📱 **Fully Responsive** design that works on all devices
- ⭐ **Rating System** with visual star ratings
- 🎨 **Modern UI** with beautiful gradients and animations

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons (SVG)
- **Images**: Unsplash (placeholder images)

## Project Structure

```
beauty-masters/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx (Homepage)
│   │   └── masters/
│   │       ├── page.tsx (Masters listing)
│   │       └── [id]/page.tsx (Individual master profile)
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── MasterCard.tsx
│   │   └── SearchFilters.tsx
│   └── data/
│       └── masters.ts (Mock data)
├── public/
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have Node.js installed on your system. You can download it from [nodejs.org](https://nodejs.org/).

### Installation

1. **Clone or download the project files**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

## Pages & Features

### Homepage (`/`)
- Hero section with call-to-action buttons
- Statistics overview
- Featured masters showcase
- Services overview
- Final call-to-action section

### Masters Directory (`/masters`)
- Search functionality (name, services, description)
- City filter dropdown
- Service type filter dropdown
- Responsive grid layout
- Clear filters option
- Results count display

### Individual Master Profile (`/masters/[id]`)
- Detailed master information
- Professional photo
- Rating and price display
- Services list
- Specialties tags
- Experience information
- Contact buttons

## Mock Data

The application includes 8 sample beauty masters with realistic data:
- Professional photos from Unsplash
- Various cities across the US
- Different service types (Hair Styling, Makeup, Nails, Skincare)
- Realistic pricing ranges
- Star ratings
- Detailed descriptions and specialties

## Customization

### Adding New Masters
Edit `src/data/masters.ts` to add new masters to the directory.

### Styling
The application uses Tailwind CSS with a custom color palette. You can modify colors in `tailwind.config.js`.

### Components
All components are reusable and can be easily modified or extended.

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions, please open an issue on the repository.

---

**Note**: This is a demo application with mock data. In a production environment, you would typically connect to a real database and implement user authentication, booking systems, and payment processing.
