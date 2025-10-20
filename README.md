# PortfolAI - Multi-User Financial Advisor Platform

A complete **multi-user web application** for financial advisors with AI-powered meeting summaries, client management, and secure authentication.

## 🎯 Features

- 🔐 **User Authentication** - Secure signup/login with JWT tokens
- 👥 **Multi-User Support** - Each advisor has separate, secure data
- 🤖 **AI Meeting Summaries** - Automatic summaries using Claude AI
- 😊 **Sentiment Analysis** - Track client sentiment (positive/negative/neutral)
- 📅 **Meeting Calendar** - Visual calendar with scheduled meetings
- 👨‍💼 **Client Management** - Add, edit, delete clients
- 📝 **Meeting Notes** - Document meetings with AI-generated summaries
- 📊 **Dashboard** - Overview of all clients and meetings
- 📈 **Stock Widget** - Live market data display
- 💾 **PostgreSQL Database** - Persistent data storage

## 🚀 Quick Start

**See [QUICKSTART.md](./QUICKSTART.md)** for the fastest way to get started!

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

### 5-Step Setup

1. **Install PostgreSQL** from https://www.postgresql.org/download/
2. **Create Database**: `psql -U postgres -c "CREATE DATABASE portfolai;"`
3. **Run Schema**: `psql -U postgres -d portfolai -f database.sql`
4. **Configure**: Edit `.env` with your PostgreSQL password
5. **Start Servers**:
   - Backend: `npm run server`
   - Frontend: `npm start`

Open your browser to the URL shown by the frontend server.

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Fast setup guide (5 steps)
- **[SETUP.md](./SETUP.md)** - Detailed setup and architecture
- **[database.sql](./database.sql)** - Database schema

## 🏗️ Architecture

### Backend (Node.js/Express)
- RESTful API with JWT authentication
- PostgreSQL database integration
- Claude AI proxy endpoint
- Password hashing with bcrypt
- Input validation

### Frontend (React)
- Single-page application
- Component-based architecture
- JWT token management
- Real-time API integration
- Responsive design

### Database (PostgreSQL)
- `users` - User accounts
- `clients` - Client information
- `meetings` - Meeting notes and summaries
- `scheduled_meetings` - Future appointments

## 🔒 Security

- ✅ Password hashing (bcrypt, 10 rounds)
- ✅ JWT authentication (7-day expiry)
- ✅ Protected API endpoints
- ✅ SQL injection prevention
- ✅ User data isolation
- ✅ Input validation

## 🛠️ Tech Stack

**Backend:**
- Express.js
- PostgreSQL (pg)
- JWT (jsonwebtoken)
- bcrypt.js
- express-validator

**Frontend:**
- React 18
- Vanilla JavaScript
- CSS3
- Font Awesome

**AI:**
- Anthropic Claude API (claude-3-5-sonnet)

## 📁 Project Structure

```
ai-advisor-chat/
├── server.js           # Backend API server
├── app.js              # React frontend application
├── database.sql        # PostgreSQL schema
├── .env                # Environment variables
├── package.json        # Dependencies
├── styles.css          # Main styles
├── auth.css            # Authentication styles
├── index.html          # HTML entry point
├── config.js           # API configuration
├── QUICKSTART.md       # Quick setup guide
├── SETUP.md            # Detailed documentation
└── README.md           # This file
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Meetings
- `GET /api/clients/:clientId/meetings` - Get meetings
- `POST /api/clients/:clientId/meetings` - Create meeting

### Scheduled Meetings
- `GET /api/clients/:clientId/scheduled-meetings` - Get scheduled
- `POST /api/clients/:clientId/scheduled-meetings` - Schedule meeting

### AI
- `POST /api/claude` - Generate AI summary (authenticated)

## 💻 Development

### Install Dependencies
```bash
npm install
```

### Start Backend (Terminal 1)
```bash
npm run server
```

### Start Frontend (Terminal 2)
```bash
npm start
```

## 🧪 Testing

Create a test account:
1. Navigate to the signup page
2. Enter your details
3. Create an account
4. Add test clients
5. Document meetings with AI summaries

## 🐛 Troubleshooting

**Database Connection Error**
- Verify PostgreSQL is running
- Check `.env` DATABASE_URL
- Ensure database `portfolai` exists

**Backend Won't Start**
- Check if port 3001 is available
- Run `npm install` to ensure dependencies
- Check console for error messages

**Frontend Issues**
- Clear browser cache
- Check browser console (F12)
- Ensure backend is running

## 📝 License

This project is proprietary software.

## 👨‍💻 Author

Built with Claude Code

---

**Ready to start?** Check out [QUICKSTART.md](./QUICKSTART.md)!
