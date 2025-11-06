# Estre - Luxury Furniture Configurator

A modern, responsive web application for configuring and customizing luxury furniture pieces. Built with React, TypeScript, Vite, and Supabase.

## 🚀 Features

- **Product Configuration**: Interactive configurators for sofas, beds, chairs, and more
- **Dynamic Pricing**: Real-time price calculation based on selections
- **Shopping Cart**: Full cart functionality with saved items
- **User Authentication**: Role-based access control (Admin, Staff, Customer)
- **Order Management**: Complete order tracking and management system
- **Responsive Design**: Beautiful UI built with Tailwind CSS and shadcn/ui

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Radix UI, Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Routing**: React Router v6
- **Forms**: React Hook Form, Zod validation

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd estre-configurator-pro
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## 🏗️ Build

To build for production:
```bash
npm run build
```

The production build will be in the `dist` directory.

To preview the production build:
```bash
npm run preview
```

## 🚀 Deployment

### Option 1: Deploy to Vercel (Recommended)

1. **Connect your repository** to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Import your Git repository
   - Vercel will auto-detect the Vite configuration

2. **Configure environment variables**:
   - In your Vercel project settings, go to "Environment Variables"
   - Add:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

3. **Deploy**:
   - Vercel will automatically deploy on every push to your main branch
   - The `vercel.json` file is already configured for optimal SPA routing

### Option 2: Deploy to Netlify

1. **Connect your repository** to Netlify:
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository

2. **Configure build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - The `netlify.toml` file is already configured

3. **Set environment variables**:
   - Go to Site settings → Environment variables
   - Add:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

4. **Deploy**:
   - Netlify will automatically deploy on every push

### Option 3: Deploy to Any Static Host

1. Build the project:
```bash
npm run build
```

2. Upload the `dist` folder to your hosting provider

3. Configure your server to:
   - Serve `index.html` for all routes (SPA routing)
   - Set proper cache headers for assets

#### Example Nginx Configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous (public) key | Yes |

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the migrations from `supabase/migrations/` in your Supabase SQL editor
3. Copy your project URL and anon key from Supabase settings
4. Add them to your environment variables

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🏗️ Project Structure

```
estre-configurator-pro/
├── public/           # Static assets
├── src/
│   ├── components/   # React components
│   ├── hooks/        # Custom React hooks
│   ├── integrations/ # Third-party integrations (Supabase)
│   ├── lib/          # Utility functions
│   ├── pages/        # Page components
│   └── main.tsx      # Entry point
├── supabase/         # Supabase migrations
├── vite.config.ts    # Vite configuration
└── package.json      # Dependencies
```

## 🐛 Troubleshooting

### Build Errors

- Ensure all environment variables are set
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

### Routing Issues

- Ensure your hosting provider is configured to serve `index.html` for all routes
- Check `vercel.json` or `netlify.toml` for proper redirect configuration

### Supabase Connection Issues

- Verify your Supabase URL and keys are correct
- Check Supabase project status and API access
- Ensure Row Level Security (RLS) policies are configured correctly

## 📄 License

Private - All rights reserved

## 👥 Support

For issues or questions, please contact the development team.
