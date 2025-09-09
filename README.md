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
- **Maps**: Google Maps JavaScript API + Places API

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

### Environment Setup

1. **Copy the environment example file**
   ```bash
   cp env.example .env.local
   ```

2. **Configure your environment variables**
   Edit `.env.local` and add your API keys:
       - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Your Google Maps API key
   - Firebase configuration variables

### Google Maps API Setup

1. **Create a Google Cloud Project** (if you don't have one)
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable required APIs**
   - Maps JavaScript API
   - Places API
   - Geocoding API (if using geocoding features)

3. **Create an API Key**
   - Go to **Credentials** → **Create Credentials** → **API Key**
   - Copy the generated key

4. **Configure API Key Restrictions**
   - Click on your API key to edit it
   - Set **Application restrictions** to "HTTP referrers (web sites)"
   - Add these referrer patterns:
     ```
     http://localhost:3000/*
     http://127.0.0.1:3000/*
     ```
   - Set **API restrictions** to restrict to the APIs you enabled above


5. **Enable Billing**
   - Google Maps APIs require billing to be enabled
   - The free tier includes generous usage limits

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



## Troubleshooting

### Google Maps Issues

**Error: "RefererNotAllowedMapError" or "Google Maps key is restricted for this origin"**

This error occurs when your Google Maps API key is not configured to allow requests from your local development environment.

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your API key
4. Under **Application restrictions**, ensure it's set to "HTTP referrers (web sites)"
5. Add these referrer patterns:
   ```
   http://localhost:3000/*
   http://127.0.0.1:3000/*
   ```
6. Save the changes
7. Reload your application

**Error: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing"**

This error occurs when the environment variable is not set.

**Solution:**
1. Ensure you have a `.env.local` file in your project root
2. Add your Google Maps API key:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```
3. Restart your development server

**Error: "Places API failed to load"**

This error occurs when the Places API is not properly enabled or configured.

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Library**
3. Search for and enable **"Places API"**
4. Ensure your API key has access to the Places API
5. Check that referrer restrictions include your domain

### Firebase Issues

**Error: "Firebase configuration missing"**

**Solution:**
1. Ensure all Firebase environment variables are set in `.env.local`
2. Check that your Firebase project is properly configured
3. Verify that the required Firebase services are enabled

## Support

If you encounter any issues or have questions, please open an issue on the repository.

---

**Note**: This is a demo application with mock data. In a production environment, you would typically connect to a real database and implement user authentication, booking systems, and payment processing.
