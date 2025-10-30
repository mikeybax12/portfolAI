# Database Migration Guide

## Upgrading to Action Items & Personal Notes Feature

This guide will help you upgrade your existing PortfolAI database to support the new features:
- ✅ Action items with checkboxes on meeting cards
- 💬 "Remember for Next Time" personal notes
- 📊 Enhanced sentiment scoring (0-10 scale with color gradients)

---

## Migration Steps

### Step 1: Backup Your Database (IMPORTANT!)

Before making any changes, **backup your existing database**:

```bash
# Windows Command Prompt or PowerShell
pg_dump -U postgres -d portfolai > portfolai_backup.sql
```

If something goes wrong, you can restore with:
```bash
psql -U postgres -d portfolai < portfolai_backup.sql
```

### Step 2: Run the Migration Script

Navigate to your project directory and run the migration:

```bash
cd "C:\Users\Bobby Baxter\ai-advisor-chat"
psql -U postgres -d portfolai -f database-migration.sql
```

Enter your PostgreSQL password when prompted.

You should see:
```
ALTER TABLE
ALTER TABLE
ALTER TABLE
UPDATE X
ALTER TABLE
ALTER TABLE
       status
------------------------
 Migration completed successfully!
```

### Step 3: Verify Migration

Connect to your database and verify the changes:

```bash
psql -U postgres -d portfolai

# Check the meetings table structure
\d meetings

# You should see these new columns:
# - sentiment (integer, 0-10)
# - action_items (jsonb)
# - personal_notes (jsonb)

# Exit
\q
```

---

## What Changed?

### Database Schema

**Before:**
```sql
sentiment VARCHAR(20)  -- "positive", "negative", "neutral"
```

**After:**
```sql
sentiment INTEGER CHECK (sentiment >= 0 AND sentiment <= 10)
action_items JSONB DEFAULT '[]'::jsonb
personal_notes JSONB DEFAULT '[]'::jsonb
```

### Data Migration

Your existing meetings will be automatically converted:
- `"positive"` → `8/10`
- `"neutral"` → `5/10`
- `"negative"` → `2/10`

New meetings will get AI-generated:
- Sentiment scores from 0-10
- Action items extracted from notes
- Personal notes for relationship building

---

## Testing the Migration

1. **Start your server:**
   ```bash
   npm run server
   ```

2. **Start your frontend:**
   ```bash
   npm start
   ```

3. **Test the new features:**
   - Create a new meeting with notes like:
     ```
     Client wants to rollover $500k from old 401k.
     Needs withdrawal paperwork for daughter's wedding next month.
     Seemed very happy with portfolio performance.
     ```

   - You should see:
     - ✅ Action items: "Process $500k rollover", "Send withdrawal paperwork"
     - 💬 Remember: "Ask how daughter's wedding went"
     - Sentiment: "Very Positive (8/10)" with green color

4. **Test existing meetings:**
   - Your old meetings should display with converted sentiment scores
   - Click on a client to see their meeting history
   - Sentiment badges should show colors (red for low, grey for neutral, green for high)

---

## Rollback (If Needed)

If something goes wrong, you can rollback to your backup:

```bash
# Drop the current database
psql -U postgres -c "DROP DATABASE portfolai;"

# Recreate it
psql -U postgres -c "CREATE DATABASE portfolai;"

# Restore from backup
psql -U postgres -d portfolai < portfolai_backup.sql
```

---

## Deploying to Railway (Production)

If you're using Railway for production:

1. **Push your code changes to GitHub:**
   ```bash
   git add .
   git commit -m "Add action items and personal notes features"
   git push
   ```

2. **Run migration on Railway database:**
   - Go to your Railway project
   - Click on your PostgreSQL database
   - Go to "Query" tab
   - Copy and paste the contents of `database-migration.sql`
   - Click "Run Query"

3. **Verify deployment:**
   - Railway will automatically redeploy your backend
   - Visit your production URL to test the new features

---

## Troubleshooting

### "relation does not exist" error
- Make sure you're connected to the correct database (`portfolai`)
- Check that the migration script ran successfully

### Action items not showing
- Check browser console for errors
- Verify the `action_items` column exists: `\d meetings` in psql
- Try creating a new meeting (old meetings won't have action items)

### Sentiment colors not working
- Hard refresh your browser (Ctrl + Shift + R)
- Clear browser cache
- Check that sentiment values are integers (not text)

### Migration failed
- Restore from backup (see Rollback section)
- Check PostgreSQL error messages
- Ensure you're running the latest code

---

## Need Help?

If you encounter issues:
1. Check the error messages carefully
2. Verify your backup was created successfully
3. Review the QUICKSTART.md for general setup help
4. Check browser console (F12) for frontend errors
5. Check terminal for backend errors

---

**Happy upgrading!** 🎉

Your meetings just got a whole lot smarter with AI-powered action items and personal notes!
