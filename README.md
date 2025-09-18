# Parscade

Enterprise-grade document processing platform with intelligent parsing capabilities.

## Features

- **Secure Authentication**: Enterprise-grade auth with password reset flow
- **Document Processing**: AI-powered document parsing and data extraction
- **Real-time Dashboard**: Monitor processing workflows and analytics
- **Team Management**: Account settings and team collaboration tools
- **API Integration**: RESTful APIs and webhook support

## Quick Start

### Prerequisites

- Node.js 18+ 
- Supabase account
- Environment variables configured

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_ANALYTICS_KEY=your-analytics-key (optional)
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

## Password Reset Configuration

### Supabase Setup

1. **Authentication Settings**:
   - Site URL: `https://your-domain.com`
   - Redirect URLs: `https://your-domain.com/reset-password`

2. **Email Template** (Authentication → Email Templates → Reset Password):
   ```html
   <a href="{{ .ConfirmationURL }}">Reset Your Password</a>
   ```

3. **SMTP Configuration** (recommended for production):
   - Configure custom SMTP provider
   - Test email delivery

### Security Features

- Rate limiting (3 attempts per 15 minutes)
- Enterprise password requirements (12+ chars, mixed case, numbers, symbols)
- Session validation and token verification
- Secure redirect handling
- Recovery mode navigation blocking

## Deployment

### Docker

```bash
docker build -t parscade .
docker run -p 80:80 parscade
```

### Environment Variables for Build

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=your-url \
  --build-arg VITE_SUPABASE_ANON_KEY=your-key \
  -t parscade .
```

## Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **State Management**: React Context + Reducers
- **Routing**: React Router v7
- **Animations**: Framer Motion
- **Validation**: Zod schemas
- **Logging**: Pino with Elasticsearch transport

## Security

- Input validation with Zod schemas
- CSRF protection on forms
- Secure session management
- Rate limiting on sensitive operations
- Enterprise password requirements
- Comprehensive error handling without data leakage

## Support

- Email: admin@parscade.com
- Documentation: Available in codebase
- Issues: Contact support team

## License

Proprietary - All rights reserved