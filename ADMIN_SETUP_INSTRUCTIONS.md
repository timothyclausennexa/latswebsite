# Admin Setup Instructions

## Steps to Set Up Admin System

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/ecjczgwzzqinulbmsvkc/sql/new
   - This will open the SQL editor for your project

2. **Run the Admin Setup SQL**
   Copy and paste the entire contents of `setup_admin_system.sql` file into the SQL editor and click "Run"

3. **First User Becomes Admin**
   - The FIRST person to sign up after running this SQL will automatically become the admin
   - Make sure YOU are the first to sign up!

4. **How to Access Admin Panel**
   - Sign up/Login on the website
   - Once logged in, you'll see a green "🔐 Admin" button in the header
   - Click it to open the admin dashboard

5. **Admin Controls**
   You can update in real-time:
   - Token Contract Address (CA)
   - Pump.fun Link
   - Live Stream Link

   All changes update across the entire website immediately for all users!

## Testing the Features

1. **Sign Up** - Create the first account (you'll become admin)
2. **Admin Dashboard** - Click the Admin button in header
3. **Update CA** - Enter a test contract address and save
4. **Update Links** - Add pump.fun and stream links
5. **Verify Updates** - Check that the CA appears in header and links work in buttons

## Important Notes

- Changes are saved to the database permanently
- All connected users see updates in real-time
- The CA will display across the entire site once set
- Links enable the "BUY $LATS" and "WATCH STREAM" buttons

## Troubleshooting

If the admin button doesn't appear:
1. Make sure you were the FIRST user to sign up
2. Check the browser console for any errors
3. Try refreshing the page

If updates don't save:
1. Check that all fields are filled correctly
2. URLs should start with https://
3. Check browser console for errors