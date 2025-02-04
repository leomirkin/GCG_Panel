# Corporate Dashboard Web Application

A modern corporate dashboard built with React and Firebase, featuring secure authentication, absence management, real-time chat, user status updates, and a corporate news feed.

## Features

- 🔐 Secure Authentication (Email/Password and Google Sign-in)
- 📅 Absence/Coverage Management
- 💬 Real-time Mini Chat
- 👥 Live User Status Updates
- 📰 Corporate News Feed
- 📱 Responsive Design

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Firebase account

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd corporate-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Create a Firebase project:
- Go to [Firebase Console](https://console.firebase.google.com/)
- Create a new project
- Enable Authentication (Email/Password and Google providers)
- Create a Firestore database

4. Configure environment variables:
- Copy `.env.example` to `.env`
- Fill in your Firebase configuration values

5. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Building for Production

To create a production build:

```bash
npm run build
```

## Deployment

This project is configured for deployment on Netlify. To deploy:

1. Create a new site on Netlify
2. Connect your repository
3. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
4. Add your environment variables in Netlify's dashboard

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
