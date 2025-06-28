# InboxFlow - AI-Powered Lead Management Platform

Transform your Gmail inbox into a lead-converting machine with AI-powered lead classification, automated responses, and comprehensive analytics.

## 🚀 Features

- **Gmail Integration**: Seamlessly sync with Gmail to automatically extract and classify leads
- **AI-Powered Classification**: Automatically categorize leads as Hot, Warm, or Cold using advanced AI
- **Intelligent Response Generation**: Generate personalized email responses using AI
- **Drag & Drop Lead Management**: Intuitive interface for managing leads across different stages
- **Subscription Management**: Flexible pricing tiers with Stripe integration
- **Analytics Dashboard**: Track response times, conversion rates, and performance metrics
- **Business Context Settings**: Customize AI responses with your business information

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Edge Functions, Authentication)
- **AI**: OpenAI GPT-4 for lead classification and response generation
- **Payments**: Stripe for subscription management
- **Authentication**: Google OAuth with Gmail API integration
- **Deployment**: Vercel (Frontend), Supabase (Backend)

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js 18+ installed
- A Supabase account and project
- A Stripe account (for payments)
- An OpenAI API key
- A Google Cloud Console project with Gmail API enabled

## 🔧 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Frontend
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Backend (Set these in Supabase Edge Functions)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
OPENAI_API_KEY=your_openai_api_key
```

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd inboxflows-hero-glow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in all required environment variables

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the migrations in `supabase/migrations/`
   - Configure Google OAuth in Supabase Auth settings
   - Deploy the Edge Functions in `supabase/functions/`

5. **Set up Stripe**
   - Create products and pricing in Stripe dashboard
   - Configure webhooks pointing to your Supabase Edge Function
   - Subscribe to required events (see DEPLOYMENT_CHECKLIST.md)

6. **Start the development server**
   ```bash
   npm run dev
   ```

## 📦 Deployment

### ⚠️ Important: Pre-Deployment Checklist

**Before deploying to production, please review and complete the [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) file.**

Key deployment steps:
1. Configure all environment variables for production
2. Update OAuth redirect URLs
3. Set up Stripe webhooks
4. Configure production domains in Supabase
5. Test all payment flows
6. Set up monitoring and error tracking

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Set all environment variables in Vercel dashboard
4. Deploy

### Deploy Supabase Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy
```

## 🔐 Security

- All API routes are protected with JWT authentication
- Stripe webhooks are verified with signatures
- Google OAuth requires both read and send scopes:
  - `https://www.googleapis.com/auth/gmail.readonly` (for fetching emails)
  - `https://www.googleapis.com/auth/gmail.send` (for sending auto-replies)
- Environment variables are never exposed to the client
- Rate limiting implemented on critical endpoints

## 📊 Current Status

**Development Status**: 85% Complete ✅

**Ready for Production**: After completing deployment checklist ⚠️

**Critical Blockers**:
- Environment variables configuration
- Production domain setup
- Stripe webhook configuration

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for complete details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support, please contact [support@inboxflow.com](mailto:support@inboxflow.com)

---

**Built with ❤️ using [Lovable](https://lovable.dev)**
