# PortfolAI - Quick Start Guide

## ✅ What's Already Complete

Your app is **100% built** with full authentication and database integration! Here's what you have:

- ✅ Complete backend API with JWT authentication
- ✅ PostgreSQL database schema ready
- ✅ Beautiful login/signup UI
- ✅ Multi-user support
- ✅ All features working with database
- ✅ API key already configured

## 🚀 Quick Start (5 Steps)

### Step 1: Install PostgreSQL

**Windows:**
1. Download: https://www.postgresql.org/download/windows/
2. Run installer
3. Set password for `postgres` user (write it down!)
4. Use default port `5432`
5. Finish installation

### Step 2: Create Database

Open **Command Prompt** or **PowerShell** and run:

```bash
# Connect to PostgreSQL (enter password when prompted)
psql -U postgres

# Create database
CREATE DATABASE portfolai;

# Exit
\q
```

### Step 3: Set Up Database Tables

```bash
cd "C:\Users\Bobby Baxter\ai-advisor-chat"
psql -U postgres -d portfolai -f database.sql
```

Enter your password when prompted.

### Step 4: Update Database Password

Edit `.env` file in your project folder:

Find this line:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/portfolai
```

Change `postgres:postgres` to `postgres:YOUR_PASSWORD`:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/portfolai
```

### Step 5: Start the App

**Terminal 1** - Start Backend:
```bash
npm run server
```

You should see:
```
✓ Database connected successfully
✓ Backend server running on http://localhost:3001
```

**Terminal 2** - Start Frontend:
```bash
npm start
```

You should see:
```
✓ Accepting connections at http://localhost:XXXXX
```

**Open your browser** to the URL shown (e.g., http://localhost:60338)

---

## 🎉 You're Done!

### First Time Use:

1. **Sign Up** - Create your account
2. **Add Clients** - Click "Add Client"
3. **Document Meeting** - Click "Document Meeting" and the AI will generate summaries!

### Features:

✨ **AI Summaries** - Automatic meeting summaries with sentiment analysis
👥 **Client Management** - Add, edit, delete clients
📅 **Calendar** - Visual meeting calendar
📊 **Dashboard** - Overview of all clients
📈 **Stock Widget** - Market overview
🔐 **Secure** - Password hashing, JWT tokens
👨‍👩‍👧‍👦 **Multi-User** - Each advisor has separate data

---

## 🔧 Troubleshooting

### "Error connecting to the database"
- Verify PostgreSQL is running
- Check password in `.env` file
- Ensure database `portfolai` exists

### "relation does not exist"
- Run the database.sql file: `psql -U postgres -d portfolai -f database.sql`

### Backend won't start
- Check if port 3001 is available
- Look for errors in the terminal
- Verify all npm packages installed: `npm install`

### Can't connect from frontend
- Ensure backend is running on port 3001
- Check browser console for errors
- Try refreshing the page

---

## 📊 Database Structure

Your data is stored in PostgreSQL:

**users** - User accounts with encrypted passwords
**clients** - Client information (linked to users)
**meetings** - Past meetings with AI summaries
**scheduled_meetings** - Future scheduled meetings

Each user only sees their own data!

---

## 🔒 Security Features

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens for session management
- ✅ All API endpoints protected (except signup/login)
- ✅ User data isolation (can't see other users' data)
- ✅ SQL injection protection (parameterized queries)
- ✅ Input validation on all forms

---

## 💡 Tips

1. **Sign Out**: Click your name in the header to sign out
2. **Multiple Users**: Different advisors can create separate accounts
3. **Backup**: PostgreSQL data persists even after restart
4. **Calendar**: Click any date to quickly schedule a meeting
5. **Client Details**: Click the eye icon to see full client history

---

## 📞 Support

If you have issues:
1. Check the SETUP.md file for detailed instructions
2. Verify all steps above were completed
3. Look at error messages in browser console (F12)
4. Check backend terminal for server errors

---

**Enjoy your new multi-user financial advisor app!** 🎊
